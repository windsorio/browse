const parser = require("@browselang/parser");
const util = require("util");
const { pullTags, parseRtn, parseParams, processRule } = require("./common");

const show = (obj) =>
  console.log(util.inspect(obj, false, null, true /* enable colors */));

const getChildren = (type) =>
  ({
    Program: ["rules"],
    Rule: ["fn", "args"],
    RuleSet: ["rules"],
    Paren: ["expr"],
    UnaryExpr: ["expr"],
    BinExpr: ["left", "right"],
    RuleExpr: ["expr"],
    InitRule: ["module", "name"],
    Word: [],
    Literal: [],
    Ident: [],
  }[type]);

const cleanComment = (comment) =>
  comment.startsWith("*")
    ? comment
        .slice(1)
        .split("\n")
        .map((line) => line.split("#")[1] || line.split("#")[0])
        .filter(Boolean)
        .join("")
        .trim()
    : null;

const parseComments = (ast) => {
  const commentBlocks = ast.comments.reduce((p, c) => {
    if (p.length === 0) return [c];
    const last = p[p.length - 1];

    if (c.source.startIdx === last.source.endIdx + 1) {
      last.value += "\n";
      last.value += c.value;
      last.source.endIdx = c.source.endIdx;
    } else {
      p.push(c);
    }
    return p;
  }, []);

  return commentBlocks;
};

const dfsTraverse = (node, fn) => {
  fn(node);
  const children = getChildren(node.type);
  if (children) {
    children.forEach((child) => {
      if (node[child]) {
        if (Array.isArray(node[child])) {
          node[child].map((child) => dfsTraverse(child, fn));
        } else {
          dfsTraverse(node[child], fn);
        }
      } else if (node[child] === undefined) {
        //TODO: module should not be undefined. Null or empty object is better
        if (child !== "module") {
          show(node);
          throw new Error(
            `Node did not have the ${child} child indicated by 'getChildren'`
          );
        }
      }
    });
  } else if (child === undefined) {
    show(node);
    throw new Error(`Unknown Node type for getChildren ${node.type}`);
  }
};

const bfsTraverse = (node, fn) => {
  const queue = [];
  queue.push(node);
  while (queue.length) {
    const curr = queue.shift();
    fn(curr);
    const children = getChildren(curr.type);

    if (children) {
      children.forEach((child) => {
        if (curr[child]) {
          if (Array.isArray(curr[child])) {
            queue.push(...curr[child]);
          } else {
            queue.push(curr[child]);
          }
        } else if (curr[child] === undefined) {
          //TODO: module should not be undefined. Null or empty object is better
          if (child !== "module") {
            show(curr);
            throw new Error(
              `Node did not have the child ${child}indicated by 'getChildren'`
            );
          }
        }
      });
    } else if (children === undefined) {
      show(curr);
      throw new Error(`Unknown Node type for getChildren ${curr.type}`);
    }
  }
};

const assignLeadingComment = (ast, comments) => {
  /*
   * We're going to walk through the AST and look for leading from the list
   */

  const sortedTree = [];

  let sortedTreeIdx = 0;

  //Bfs walks us through the tree in a sorted manner
  bfsTraverse(ast, (node) => sortedTree.push(node));

  for (i in comments) {
    const comment = comments[i];
    const commentEnd = comment.source.endIdx;
    while (sortedTreeIdx < sortedTree.length) {
      const node = sortedTree[sortedTreeIdx];
      //If the node starts before the comment ends, we don't want it
      if (node.source.startIdx < commentEnd) {
        sortedTreeIdx++;
      }
      //Since everything is sorted, the first node we find is the one the comment belongs to
      else {
        if (node.leadingComments) node.leadingComments.push(comment);
        else node.leadingComments = [comment];
        break;
      }
    }
  }
};

//Trim source for nicer debugging
const trimSource = (ast) => {
  dfsTraverse(ast, (node) => {
    node.source = {
      ...node.source,
      sourceString: node.source.sourceString.slice(
        node.source.startIdx,
        node.source.endIdx
      ),
    };
  });
};

module.exports = (code, fileName) => {
  const rtn = {};

  const ast = parser.parse(code);

  assignLeadingComment(ast, parseComments(ast));

  trimSource(ast);

  let scope = null;

  const rules = [];

  bfsTraverse(ast, (node) => {
    if (node.leadingComments !== undefined) {
      const tags = pullTags(node.leadingComments);
      if (tags["@scope"] !== undefined) {
        scope = {};
        //If we find the scope tag set the description
        scope.desc = tags["@scope"];
        if (tags["@name"] !== undefined) {
          //If we find the name, set the name
          scope.name = tags["@name"].trim();
        } else {
          //Else set the name to be the file name
          scope.name = fileName;
        }
      }

      if (node.type === "Rule") {
        rules.push(node);
      }
    }
  });

  if (scope) {
    const scopeName = scope ? scope.name : fileName;
    rtn[scopeName] = {
      description: scope ? scope.desc : "",
      rules: {},
    };
    const processedRules = rules.forEach((ruleNode) => {
      //Make sure at  least one of the comments starts with a *
      ruleNode.leadingComments = ruleNode.leadingComments.filter((comment) =>
        comment.value.startsWith("*")
      );
      if (ruleNode.leadingComments.length) {
        //First we grab the tags from the comments
        const tags = pullTags(ruleNode.leadingComments);
        const ruleName = tags["@rule"] || ruleNode.args[0].value;

        const processedRule = processRule(
          ruleNode.leadingComments.map((comment) => {
            const cleanText = cleanComment(comment.value);
            return {
              ...comment,
              value: cleanText,
            };
          })
        );

        const params = {};
        //If we can't find parameters, we try to autoparse the parameters
        tags["@params"] ||
          (ruleNode.args[1].rules &&
            []
              .concat(
                ...ruleNode.args[1].rules
                  .filter((rule) => rule.fn.name.name === "bind")
                  .map((rule) => rule.args.map((arg) => arg.value))
              )
              .forEach((arg) => {
                params[arg] = {};
              }));

        if (Object.keys(params).length)
          processedRule["params"] = processedRule["params"] || params;
        //In the absenes of an @rule tag, we use the name of the rule below
        rtn[scopeName].rules[ruleName] = {
          ...processedRule,
        };
      }
    });
  }
  return rtn;
};
