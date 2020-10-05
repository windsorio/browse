"use strict";
/*
 * This code is complex. Tech debt in code this complex is incredibly costly. In order to promote maintainability, the naming schemes are very explicit as are the types at the cost of succinctness.
 *
 */
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __spreadArrays =
  (this && this.__spreadArrays) ||
  function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };
exports.__esModule = true;
var astTransformer_1 = require("./astTransformer");
console.log(astTransformer_1["default"]);
var getFreeTypeVariables = function (t) {
  switch (t._type) {
    case "var":
      return [t.name];
    case "number":
    case "bool":
    case "cssString":
    case "jsString":
    case "plainString":
    case "nil":
      return [];
    case "rule":
      return __spreadArrays(
        getFreeTypeVariables(t.left),
        getFreeTypeVariables(t.right)
      );
  }
};
var schemeGetFreeTypeVariables = function (t) {
  //The free variables in a polytype (scheme) are the variables which are in the type but not in the bound variables list
  return getFreeTypeVariables(t.type).filter(function (freeVar) {
    return !t.boundVars.includes(freeVar);
  });
};
var getAllFreeTypeVariables = function (types) {
  return types
    .map(function (t) {
      if (t._type === "scheme") return schemeGetFreeTypeVariables(t);
      return getFreeTypeVariables(t);
    })
    .reduce(function (a, b) {
      return a.concat(b);
    }, []);
};
var typeEnvGetFreeTypeVariables = function (env) {
  return getAllFreeTypeVariables(Object.values(env));
};
var applySubstitution = function (s, t) {
  switch (t._type) {
    case "var":
      if (s[t.name]) {
        return s[t.name];
      }
      return t;
    case "rule":
      return {
        _type: "rule",
        left: applySubstitution(s, t.left),
        right: applySubstitution(s, t.right),
      };
    default:
      return t;
  }
};
var schemeApplySubstitution = function (s, t) {
  //First we remove all bound variables from the substitution
  var newSub = __assign({}, s);
  t.boundVars.forEach(function (v) {
    return delete newSub[v];
  });
  //Then we apply the substitution
  var res = applySubstitution(newSub, t.type);
  //Return a new scheme with the same bound variables but with the substitution applied
  return {
    _type: "scheme",
    type: res,
    boundVars: t.boundVars,
  };
};
//@ts-ignore
var typeEnvApplySubstitution = function (s, env) {
  var rtn = {};
  Object.keys(env).forEach(function (key) {
    return (rtn[key] = schemeApplySubstitution(s, env[key]));
  });
  return rtn;
};
/*
 * Deletes variable from type environment without modyifying state.
 *
 * MIght want to optimize later but this reduces complexity for now
 */
//@ts-ignore
var removeFromTypeEnv = function (env, v) {
  var newEnv = __assign({}, env);
  delete newEnv[v];
  return newEnv;
};
/*
 * Generalize a type over all of the variables that are free in the type but not free in the type env
 */
//@ts-ignore
var generalizeType = function (env, t) {
  return {
    _type: "scheme",
    type: t,
    boundVars: getFreeTypeVariables(t).filter(function (v) {
      return !typeEnvGetFreeTypeVariables(env).includes(v);
    }),
  };
};
/*
 * We need fresh type variables for a variety of purposes. This encapsulates that behavior
 */
//@ts-ignore
var freshVariableGenerator = function () {
  var nameMap = {};
  return function (prefix) {
    if (!nameMap[prefix]) {
      nameMap[prefix] = 0;
    }
    return { _type: "var", name: prefix + ++nameMap[prefix] };
  };
};
/*
 * instantiates a scheme with fresh type variables.
 */
//@ts-ignore
var instantiateScheme = function (scheme, varGen) {
  var freshVarSub = {};
  scheme.boundVars.forEach(function (v) {
    return (freshVarSub[v] = varGen("a"));
  });
  return applySubstitution(freshVarSub, scheme.type);
};
/*
 * Attempts to bind a type variable to a type
 *
 * Avoids binding a type variable to itself
 * e.g. in ((forall 'a') a -> a)
 *
 * We would never want to bind the type (a: varT) to a
 *
 * TODO: Finish explaination
 * If the variable is free in T
 */
var bindVar = function (name, t) {
  var _a;
  if (t._type === "var" && name === t.name) return {};
  if (getFreeTypeVariables(t).includes(name))
    throw new Error("Occur Check Fails " + name + " in " + JSON.stringify(t));
  return (_a = {}), (_a[name] = t), _a;
};
/*
 * This is the function that is doing most of the inference work.
 *
 * Takes in two types and return the substitution required to make those types equal
 *
 * If there is no such substitution, this function throws and error.
 */
var unify = function (t1, t2) {
  if (t1._type === "rule" && t2._type === "rule") {
    var sub1 = unify(t1.left, t2.left);
    var sub2 = unify(
      applySubstitution(sub1, t1.right),
      applySubstitution(sub1, t2.right)
    );
    return __assign(__assign({}, sub1), sub2);
  } else if (t1._type === "var") return bindVar(t1.name, t2);
  else if (t2._type === "var") return bindVar(t2.name, t1);
  else if (t1._type === "bool" && t2._type === "bool") return {};
  else if (t1._type === "number" && t2._type === "number") return {};
  else if (t1._type === "cssString" && t2._type === "cssString") return {};
  else if (t1._type === "jsString" && t2._type === "jsString") return {};
  else if (t1._type === "plainString" && t2._type === "plainString") return {};
  else
    throw new Error(
      "Types " +
        JSON.stringify(t1) +
        " and " +
        JSON.stringify(t2) +
        " do not unify"
    );
};
/*
 * This is the main type inference function which takes in an AST and returns the type tree
 */
//@ts-ignore
var typeInferencer = function (env, node) {
  var inferLiteral = function (env, lit) {
    switch (typeof lit.value) {
      case "number":
        return { type: { _type: "number" }, sub: {} };
      case "string":
        switch (lit.quoteType) {
          case undefined:
          case '"':
          case "'":
            return { type: { _type: "plainString" }, sub: {} };
          case "`":
            return { type: { _type: "cssString" }, sub: {} };
          case "|":
            return { type: { _type: "jsString" }, sub: {} };
        }
      case "object":
        if (lit === null) return { type: { _type: "nil" }, sub: {} };
      default:
        throw new Error(
          "Could not find type for literal " + JSON.stringify(lit)
        );
    }
  };
  switch (node.type) {
    case "Program":
    //If we encounter a variable
    //the rule Rule is an Abs Expression
    //the set rule is  a Let Expression
    //Other rules are function application
    case "Rule":
    //A ruleset is interpreted as a series of function applications
    case "RuleSet":
    //The paren rule is just a noop
    case "Paren":
    //The unary expression lets us know that the expression is an int or a boolean
    case "UnaryExpr":
    //The binary expression allows us to type based on the type of underlying function
    case "BinExpr":
    //Not sure what the point of Rule Expr is TODO:
    case "RuleExpr":
    //Not sure what initRule is for TODO
    case "InitRule":
    //We should never recurse to the level of Word
    case "Word":
      throw new Error(
        "Recursion went to far, Word node hit " + JSON.stringify(node)
      );
    //Literal is the same as in lambda calculus. no transform needed
    case "Literal":
      return inferLiteral(env, node);
    //Ident is a variable node
    case "Ident":
  }
};
exports.typeInferencer = typeInferencer;
