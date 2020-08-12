"use strict";

const getSTD = require("./std");
const assert = require("assert");
const { stringify } = require("./utils");
const { resolveFn, resolveVar } = require("./scope");

const getNewScope = (parent) => {
  if (!parent) {
    parent = getSTD({ evalRuleSet, getNewScope });
  }
  return {
    fns: {},
    vars: {},
    internal: {},
    parent,
  };
};

const evalExpr = async (expr, scope) => {
  switch (expr.type) {
    case "Paren":
      return evalExpr(expr.expr, scope);
    case "Literal":
      return expr.value;
    case "Ident":
      return resolveVar(expr.name, scope);
    case "RuleSet":
      return expr;
    case "RuleExpr":
      return evalRule(expr.expr, scope);
    case "UnaryExpr":
      switch (expr.op) {
        case "!":
          return !(await evalExpr(expr.expr, scope));
        case "-":
          return -(await evalExpr(expr.expr, scope));
        default:
          throw new Error(`Invalid unary operator '${op}'`);
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
          throw new Error(`'!==' is not supported. Use '!=' instead`);
        case "===":
          throw new Error(`'===' is not supported. Use '==' instead`);
        default:
          throw new Error(`Invalid binary operator '${op}'`);
      }
  }
};

/**
 * Evaluate the `rule` in the given `scope`
 * @param {Rule} rule The rule to evaluate
 * @param {Scope} scope The scope in which to evaluate the rule
 * @returns JS return value or retVal. Can be a promise
 */
const evalRule = async (rule, scope) => {
  assert(rule.type === "Rule");
  const { fn, args } = rule;
  assert(fn.type === "Word");

  const resolvedArgs = [];
  if (args) {
    for (const arg of args) {
      resolvedArgs.push(await evalExpr(arg, scope));
    }
  }
  return resolveFn(fn.name, scope)(scope)(...resolvedArgs);
};

const evalRuleSet = async (ruleSet, parent) => {
  assert(ruleSet.type === "RuleSet");

  if (!parent) {
    parent = getSTD({ evalRuleSet, getNewScope });
  }

  const { rules: oRules } = ruleSet;
  const rules = [...oRules]; // Don't want to modify the original rules

  const scope = getNewScope(parent);
  if (!rules.length) {
    return null;
  }
  const lastRule = rules.pop();
  for (const rule of rules) {
    await evalRule(rule, scope);
  }
  return evalRule(lastRule, scope);
};

module.exports = {
  getNewScope,
  evalRule,
  evalRuleSet,
  stringify,
};
