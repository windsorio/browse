"use strict";

const fs = require("fs");
const path = require("path");

const parser = require("@browselang/parser");

const getSTD = require("./std");
const { stringify } = require("./utils");
const { resolveRule, resolveVar } = require("./scope");
const { BrowseError, stringifyError } = require("./error");

import IScope from "interfaces/IScope";


// TODO: having a global moduleCache doesn't feel good
const moduleCache = new Map();


const getNewScope = (parent?: any) : IScope => {
  if (!parent) {
    // TODO: where the value of evalrule and evalRuleSetComes from?
    parent = getSTD({ evalRule, evalRuleSet, getNewScope });
  }

  // TODO: scope shouldn't be a class ?
  return {
    parent,
    rules: {},
    vars: {},
    internal: {},
    modules: {},
    close: async () => {},
  };
};

const evalRuleSet = async (
  ruleSet: any,
  inject: {
    parent?: any,
    rules?: object,
    vars?: object,
    internal?: object
  },
  options: { reverse?: () => {} }
  ) => {
  const rules = [...ruleSet.rules]; // Don't want to modify the original rules

  // reverse is just a hack for now. The rules stdlib will replace this
  if (options.reverse) {
    rules.reverse();
  }

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

const injectProgramMeta = (node, meta) => {
  if (node && typeof node === "object") {
    for (const key in node) {
      if (key !== "source") {
        injectProgramMeta(node[key], meta);
      }
    }
    if (node.source && typeof node.source === "object") {
      node.source.document = meta.document;
      node.source.basedir = meta.basedir;
    }
  }
};

const evalProgram = async (program, { scope, document, basedir }) => {
  if (document !== "repl") {
    moduleCache.set(document, scope);
  }
  injectProgramMeta(program, { document, basedir });
  return evalRuleSet(
    {
      type: "RuleSet",
      rules: program.rules,
    },
    scope
  );
};

const loadModule = async (req, { library }) => {
  let document = req;

  // TODO: support github files, or other remotely hosted files?

  if (library) {
    // TODO: support libraries outside of stdlib?
    document = path.resolve(__dirname, "..", "stdlib", document);
  }

  // Resolve the actual module filename
  try {
    const stats = await fs.promises.lstat(document);
    if (stats.isDirectory()) {
      document = path.join(document, "main.browse");
    }
  } catch (e) {
    document += ".browse";
  }
  try {
    await fs.promises.access(document);
  } catch (e) {
    throw new Error(`Cannot find module '${document}'`);
  }

  if (moduleCache.has(document)) {
    return moduleCache.get(document);
  }

  const ext = path.extname(document);
  if (ext === ".browse") {
    const scope = getNewScope();
    const code = fs.readFileSync(document, "utf8");
    let program;
    try {
      program = parser.parse(code);
    } catch (e) {
      e.message = `Error importing ${document}\n` + e.message;
      throw e;
    }
    await evalProgram(program, {
      scope,
      document,
      basedir: path.dirname(document),
    });
    return scope;
  } else if (ext === ".js") {
    const jsModule = require(document);

    const stdScope = getNewScope().parent;
    return getNewScope(jsModule.browse(stdScope));
  } else {
    throw new Error(`Cannot import module of type '${ext}'`);
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
    if (fn.name.name === "import") {
      const fname = path.basename(resolvedArgs[0]);
      let to = fname.split(".")[0];
      if (resolvedArgs.length === 3) {
        to = resolvedArgs[2];
      }
      if (scope.modules[to])
        throw new Error(`Module ${to} was already imported`);

      if (/^[\.\/]/.test(resolvedArgs[0]))
        scope.modules[to] = await loadModule(
          path.resolve(fn.source.basedir, resolvedArgs[0]),
          { library: false }
        );
      else
        scope.modules[to] = await loadModule(resolvedArgs[0], {
          library: true,
        });

      return null;
    } else {
      // It's possible for the fn call itself to throw in the case that it's not
      // async This try...catch will handle that, and also any errors from a
      // rejected promise
      const promise = Promise.resolve(
        resolveRule(fn, scope)(scope)(resolvedOpts)(...resolvedArgs)
      );
      return await promise.then((v) => (v === undefined ? null : v));
    }
  } catch (err) {
    throw BrowseError.from(err, fn.name);
  }
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
      // Handle && and || before evaluating the right side
      switch (expr.op) {
        case "&&": {
          return l && (await evalExpr(expr.right, scope));
        }
        case "||": {
          return l || (await evalExpr(expr.right, scope));
        }
      }
      // Now evaluate the right side
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
