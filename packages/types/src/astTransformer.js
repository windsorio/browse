/*
 * The purpose of this file is to transform the AST into something that can be more easily type checked
 */

//TODO: move to general utilities
//

const varMap = {};

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

//TODO move to general utilties
const getRulesByName = (rules, name) =>
  rules
    .map((rule, index) => ({ rule, index }))
    .filter((ruleObj) => ruleObj.rule.fn.name.name === name);

//TODO move to general utilties
const removeRulesByName = (rules, name) => {
  const indices = getRulesByName(rules, name).map((rule) => rule.index);
  return rules.filter((_, i) => !indices.includes(i));
};

//TODO move to general utilties
const getArgsFromRules = (rules) => {
  return [].concat(
    ...rules
      .filter((rule) => rule.fn.name.name === "bind")
      .map((rule) => rule.args.map((arg) => arg.value))
  );
};

const parseSet = (rule) => ({ name: rule.args[0].value, exp: rule.args[1] });

/*
 * Converts arguments to abstractions, places next as the expression once all of the arguments have been consumed
 *
 * e.g
 *   (a, b, c) => e  ===
 *   Abs a (Abs b (Abs e))
 *
 * TODO: Change the calculus to allow multi argument abstraction
 */
const argsToAbs = (args, next) => {
  if (!args.length) return next;
  return {
    type: "Abs",
    arg: args[0],
    e: argsToAbs(args.slice(1), next),
  };
};

/*
 * Converts arguments to application
 *
 * nests the function within the final application
 *
 * This is equivilent to a multi-argument function in our calculus
 *
 * e.g
 *   f(a1, a2, a3) ===
 *   App (App (App f a1) a2) a3
 *
 * TODO: Change the calculus to allow multi argument application
 */
const argsToApp = (args, fn) => {
  if (!args.length) return makeFunctional(fn);
  return {
    type: "App",
    e1: argsToApp(args.slice(0, args.length - 1), fn),
    e2: makeFunctional(args[args.length - 1]),
  };
};

//TODO: Any place where we have a 'rules' field on a node, we should wrap this in a ruleset for consistency (excluding the rules field on a RuleSet node). For instance, on the program node.
const makeRuleListFunctional = (rules) => {
  if (rules.length === 1) return makeFunctional(rules[0]);
  //Convert all the rules to vfunction application except for the rule rule which is converted to abstraction and the set rule which is converted to let.
  const rule = rules[0];

  if (rule.fn.name.name === "rule") {
    const name = rule.args[0].value;
    const args = getArgsFromRules(rule.args[1].rules);
    const nonBindRules = removeRulesByName(rule.args[1].rules, "bind");
    const nestedAbs = argsToAbs(args, makeRuleListFunctional(nonBindRules));
    //TODO: this will not work with repeat rule definitions
    return {
      //Let
      type: "Let",
      //The rule
      name,
      //Equal it's converted ruleset
      e1: nestedAbs,
      //In the rest of the ruleset
      e2: makeRuleListFunctional(rules.slice(1)),
    };
  } else if (rule.fn.name.name === "set") {
    const { name, exp } = parseSet(rule);
    //TODO: this will not work with repeat sets on the same variable (Fix with internal naming adjustments? e.g set x 10; sleep($x); set x 20; sleep($x) => set x1 10; sleep $x1; set x2 20; sleep $x2;)
    return {
      //Let
      type: "Let",
      //The variable
      name,
      //Equal it's functional conversion
      e1: makeFunctional(exp),
      //In the rest of the ruleset
      e2: makeRuleListFunctional(rules.slice(1)),
    };
  } else if (rule.fn.name.name === "bind") {
    throw new Error(
      `Bind rules should be removed before functional parsing of Rule List`
    );
  } else {
    //Here we want to do some side effectful thing
    //We accomplish this with a dummy Let
    // Let blah = sleep(10) in (The rest of the program)
    //TODO: Create a new rule in the lambda calculus to allow for side effectfullness (dummy lets)
    const name = rule.fn.name.name;
    if (!varMap[name]) varMap[name] = 0;
    return {
      type: "Let",
      name: `__${name}__${++varMap[name]}`,
      e1: makeFunctional(rule),
      e2: makeRuleListFunctional(rules.slice(1)),
    };
  }
};

const getLiteralType = (lit) => {
  switch (typeof lit.value) {
    case "number":
      return "numberLit";
    case "string":
      switch (lit.quoteType) {
        case "":
        case '"':
        case "'":
          return "plainStringLit";
        case "`":
          return "cssStringLit";
        case "|":
          return "jsStringLit";
      }
    case "boolean":
      return "booleanLit";
    case "object":
      if (lit === null) return "nilLit";
    default:
      throw new Error(`Could not find type for literal ${JSON.stringify(lit)}`);
  }
};

const makeFunctional = (node) => {
  switch (node.type) {
    case "Program":
      return {
        type: "Let",
        name: "__program__",
        e1: makeRuleListFunctional(node.rules),
        e2: {
          type: "Var",
          name: "__program__",
        },
      };
    case "Rule":
      return argsToApp(node.args, node.fn);
    case "InitRule":
      return {
        type: "Var",
        name: node.name.name,
      };
    case "RuleSet":
      return makeRuleListFunctional(node.rules);
    case "Literal":
      return {
        type: getLiteralType(node),
        value: node.value,
      };
    case "Ident":
      return {
        type: "Var",
        name: node.name,
      };
    // 1 - 2 === App (App - 1) 2
    case "BinExpr":
      return {
        type: "App",
        e1: {
          type: "App",
          e1: {
            type: "Var",
            name: node.op,
          },
          e2: makeFunctional(node.left),
        },
        e2: makeFunctional(node.right),
      };
    case "RuleExpr":
    case "Paren":
      return makeFunctional(node.expr);
    default:
      return `${node.type} Not Yet Implemented`;
  }
};

//TODO: move to general utilities
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

//TODO: move to general utilities
const trimSource = (ast) => {
  dfsTraverse(ast, (node) => {
    delete node.source;
  });
};

module.exports = (tree) => {
  trimSource(tree);
  return makeFunctional(tree);
};
