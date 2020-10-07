//TODO: Type this file once the ts PR goes through
//TODO: move to general utilities
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

const trimSource = (ast) => {
  dfsTraverse(ast, (node) => {
    delete node.source;
  });
};

const getRulesByName = (rules, name) =>
  rules
    .map((rule, index) => ({ rule, index }))
    .filter((ruleObj) => ruleObj.rule.fn.name.name === name);

const removeRulesByName = (rules, name) => {
  const indices = getRulesByName(rules, name).map((rule) => rule.index);
  return rules.filter((_, i) => !indices.includes(i));
};

const getArgsFromRules = (rules) => {
  return [].concat(
    ...rules
      .filter((rule) => rule.fn.name.name === "bind")
      .map((rule) => rule.args.map((arg) => arg.value))
  );
};

module.exports = {
  dfsTraverse,
  trimSource,
  removeRulesByName,
  getArgsFromRules,
};
