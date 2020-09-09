const parser = require("@browselang/parser");
const util = require("util");
const { pullTags, parseRtn, parseParams } = require("./common");

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
        if (node.comments) node.leadingComments.push(comment);
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
  dfsTraverse(ast, (node) => {
    if (node.leadingComments) {
      node.commentTags = pullTags(node.leadingComments);
    }
  });
  dfsTraverse(
    ast,
    (node) =>
      node.leadingComments &&
      console.log("Found", node.leadingComments, node.source, node.commentTags)
  );
  return rtn;
};
