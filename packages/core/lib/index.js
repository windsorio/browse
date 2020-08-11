"use strict";

const std = require("./std");
const assert = require("assert");
const { stringify } = require("./utils");
const { resolveFn, resolveVar } = require("./scope");

const getNewScope = (parent = std) => ({
  fns: {},
  vars: {},
  parent,
});

const evalExpr = (expr, scope) => {
  switch (expr.type) {
    case "Paren":
      return evalExpr(expr.expr, scope);
    case "Literal":
      return expr.value;
    case "Ident":
      return resolveVar(expr.name, scope);
    case "UnaryExpr":
      switch (expr.op) {
        case "!":
          return !evalExpr(expr.expr, scope);
        case "-":
          return -evalExpr(expr.expr, scope);
        default:
          throw new Error(`Invalid unary operator '${op}'`);
      }
    case "BinExpr":
      const l = evalExpr(expr.left, scope);
      const r = evalExpr(expr.right, scope);
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
 */
const evalRule = (rule, scope) => {
  assert(rule.type === "Rule");
  const { fn, args } = rule;
  assert(fn.type === "Word");

  let resolvedArgs;
  if (args) {
    // first resolve expressions
    resolvedArgs = args.map((e) => evalExpr(e, scope));
  }
  const retVal = resolveFn(fn.name, scope)(scope)(...resolvedArgs);
  return retVal;
};

const evalRuleSet = (ruleSet, parent = std) => {
  assert(ruleSet.type === "RuleSet");

  const { rules } = ruleSet;

  const scope = getNewScope(parent);
  if (!rules.length) {
    return null;
  }
  const lastRule = rules.pop();
  rules.forEach((rule) => {
    evalRule(rule, scope);
  });
  return evalRule(lastRule, scope);
};

module.exports = {
  getNewScope,
  evalRule,
  evalRuleSet,
  stringify,
};
