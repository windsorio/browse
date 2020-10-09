/*
 * The purpose of this file is to transform the AST into something that can be more easily type checked
 */

const {
  trimSource,
  removeRulesByName,
  getArgsFromRules,
} = require("./astUtilities.js");

const varMap = {};

const parseSet = (rule) => ({
  name: rule.args[0].value,
  exp: rule.args[1],
  node: rule,
});

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
    node: {},
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
    node: {},
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
    return {
      //Let
      type: "Let",
      //The rule
      name,
      //Equal it's converted ruleset
      //TODO: move this rule into the 'Rule' case on makeFunctional.
      e1: { ...nestedAbs, node: rule },
      //In the rest of the ruleset
      e2: makeRuleListFunctional(rules.slice(1)),

      //This Let is a construct not relevant in browse. What we actually care about is the type of e1, the function itself which is added accordingly above.
      node: {},
    };
  } else if (rule.fn.name.name === "set") {
    const { name, exp } = parseSet(rule);
    return {
      //Let
      type: "Let",
      //The variable
      name,
      //Equal it's functional conversion
      e1: makeFunctional(exp),
      //In the rest of the ruleset
      e2: makeRuleListFunctional(rules.slice(1)),
      node: rule,
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
    //IDEA do e1 then e2 { type: "Do", e1, e2 }
    const name = rule.fn.name.name;
    if (!varMap[name]) varMap[name] = 0;
    return {
      type: "Let",
      name: `__${name}__${++varMap[name]}`,
      e1: makeFunctional(rule),
      e2: makeRuleListFunctional(rules.slice(1)),
      //This let is a construct not relevant in browse (It's return type is actually the return type of the evaluation of the rest of the ruleset). What the node actually corresponds to is the type of e1.
      node: {},
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
          node: {},
        },
        node,
      };
    case "Rule":
      return argsToApp(node.args, node.fn);
    case "InitRule":
      return {
        type: "Var",
        name: node.name.name,
        node,
      };
    case "RuleSet":
      return makeRuleListFunctional(node.rules);
    case "Literal":
      return {
        type: getLiteralType(node),
        value: node.value,
        node,
      };
    case "Ident":
      return {
        type: "Var",
        name: node.name,
        node,
      };
    // 1 - 2 === App (App - 1) 2
    //TODO: This is a place where the types are not going to make sense without the lambda calculus formulation
    //Find a way to fix this
    case "BinExpr":
      return {
        type: "App",
        e1: {
          type: "App",
          e1: {
            type: "Var",
            name: node.op,
            node,
          },
          e2: makeFunctional(node.left),
          //We don't care about the type given by applying 1 arg to a binary function. This doesn't make sense in browse
          node: node.left,
        },
        e2: makeFunctional(node.right),
        //The type of this should be the type of the whole Expression after it is applied
        //I'm not sure that this is relevent
        //TODO: Revisit this
        node: {},
      };
    case "RuleExpr":
    case "Paren":
      return makeFunctional(node.expr);
    default:
      return `${node.type} Not Yet Implemented`;
  }
};

module.exports = (tree) => {
  trimSource(tree);
  return makeFunctional(tree);
};
