"use strict";

const getSTD = require("./std");
const { stringify } = require("./utils");
const { resolveRule, resolveVar } = require("./scope");
const { BrowseError, stringifyError } = require("./error");

const getNewScope = (parent) => {
  if (!parent) {
    parent = getSTD({ evalRule, evalRuleSet, getNewScope });
  }
  return {
    parent,
    rules: {},
    vars: {},
    internal: {},
    close: async () => {},
  };
};

const evalExpr = async (expr, scope) => {
  switch (expr.type) {
    case "Paren":
      return evalExpr(expr.expr, scope);
    case "Literal":
      return expr.value;
    case "Ident":
      return resolveVar(expr, scope);
    case "RuleSet":
      return { ...expr, scope }; // tracks lexical scope
    case "RuleExpr":
      return evalRule(expr.expr, scope);
    case "UnaryExpr":
      switch (expr.op) {
        case "!":
          return !(await evalExpr(expr.expr, scope));
        case "-":
          return -(await evalExpr(expr.expr, scope));
        default:
          throw new BrowseError({
            message: `Invalid unary operator '${expr.op}'`,
            node: expr,
          });
      }
    case "BinExpr":
      const l = await evalExpr(expr.left, scope);
      const r = await evalExpr(expr.right, scope);
      switch (expr.op) {
        case "*":
          return l * r;
        case "/":
          return l / r;
        case "%":
          return l % r;
        case "+":
          return l + r;
        case "-":
          return l - r;
        case ">=":
          return l >= r;
        case "<=":
          return l <= r;
        case ">":
          return l > r;
        case "<":
          return l < r;
        case "!=":
          return l !== r;
        case "==":
          return l === r;
        case "!==":
          throw new BrowseError({
            message: `'!==' is not supported. Use '!=' instead`,
            node: expr,
          });
        case "===":
          throw new BrowseError({
            message: `'===' is not supported. Use '==' instead`,
            node: expr,
          });
        default:
          throw new BrowseError({
            message: `Invalid unary operator '${expr.op}'`,
            node: expr,
          });
      }
    default:
      throw new BrowseError({
        message: `Invalid Expression Type'${expr.type}'`,
        node: expr,
      });
  }
};

/**
 * Evaluate the `rule` in the given `scope`
 * @param {Rule} rule The rule to evaluate
 * @param {Scope} scope The scope in which to evaluate the rule
 * @returns JS return value from the rule. Can be a promise
 */
const evalRule = async (rule, scope) => {
  const { fn, args } = rule;

  const resolvedOpts = {};
  for (const opt of fn.options) {
    if (resolvedOpts[opt.key.name] !== undefined) {
      throw new BrowseError({
        message: `Option '${opt.key.name}' has already been provided to this rule`,
        node: opt.key,
      });
    }
    resolvedOpts[opt.key.name] = await evalExpr(opt.value, scope);
  }

  const resolvedArgs = [];
  if (args) {
    // Should be evaluated in series, let to right. Cannot do Promise.all here
    for (const arg of args) {
      resolvedArgs.push(await evalExpr(arg, scope));
    }
  }
  try {
    // It's possible for the fn call itself to throw in the case that it's not
    // async This try...catch will handle that, and also any errors from a
    // rejected promise
    const promise = Promise.resolve(
      resolveRule(fn.name, scope)(scope)(resolvedOpts)(...resolvedArgs)
    );
    return await promise.then((v) => (v === undefined ? null : v));
  } catch (err) {
    throw BrowseError.from(err, fn.name);
  }
};

const evalRuleSet = async (ruleSet, inject = {}) => {
  const rules = [...ruleSet.rules]; // Don't want to modify the original rules

  if (!rules.length) {
    return null;
  }

  // Setup scope
  let scope;
  if (inject.parent !== undefined) {
    // if inject has a `parent` set, then we just treat inject as the scope
    // inject should RARELY be used this way
    scope = inject;
  } else {
    scope = getNewScope(ruleSet.scope);
    Object.assign(scope.rules, inject.rules || {});
    Object.assign(scope.vars, inject.vars || {});
    Object.assign(scope.internal, inject.internal || {});
  }

  const lastRule = rules.pop();
  for (const rule of rules) {
    try {
      await evalRule(rule, scope);
    } catch (err) {
      throw BrowseError.from(err, ruleSet);
    }
  }
  return evalRule(lastRule, scope).catch((err) => {
    throw BrowseError.from(err, ruleSet);
  });
};

// const evalArray = async (ruleSet) => {
//   for (const rule of ruleSet.rules) {
//     if (rule.fn.name.name !== "id") {
//       throw new Error(`The RuleSet is not a valid array`);
//     }
//   }
//   const out = {
//     ...ruleSet,
//     rules: [],
//   };
//   await evalRuleSet(ruleSet, {
//     rules: {
//       id: (_) => (_) => (v) => {
//         out.rules.push(v);
//         return v;
//       },
//     },
//   });
//   return out.rules.length;
// };

const claimDict = (ruleSet) => {
  const keys = new Set();
  for (const rule of ruleSet.rules) {
    const { fn, args } = rule;
    if (!["record", "r", "_"].includes(fn.name.name)) {
      throw new Error(`The RuleSet is not a valid dictionary`);
    }
  }

  return ruleSet.rules.length;
};

const toJSDict = async (ruleSet) => {
  claimDict(ruleSet);
  const obj = [];
  await evalRuleSet(ruleSet, {
    rules: {
      id: (_) => (_) => (v) => {
        arr.push(v);
        return v;
      },
    },
  });
  return obj;
};

module.exports = {
  getNewScope,
  evalRule,
  evalRuleSet,
  stringify,
  stringifyError,
};
