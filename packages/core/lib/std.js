const {
  resolveFn,
  resolveFnScope,
  resolveVar,
  resolveVarScope,
} = require("./scope");
const { help, stringify } = require("./utils");

const get = (scope) => (name) => resolveVar(name, scope);
const set = (scope) => (name, value) => {
  if (scope.vars[name]) {
    throw new Error(`Variable '${name}' is already defined`);
  }
  scope.vars[name] = value;
  return value;
};

/**
 * The root scope that contains all the basic/standard functions and variables
 */
module.exports = ({ evalRuleSet, getNewScope }) => ({
  parent: null, // This is the root
  vars: {},
  internal: {},
  fns: {
    help: (scope) => (key) => {
      // Find the lowest scope that actually has the 'help' function
      const helpScope = resolveFnScope("help", scope);
      help({
        resolveFn,
        scope: helpScope,
        key,
        functions: {
          help:
            "Prints out help information about all the available functions. Pass an argument to get information on a specific function",
        },
      });
      return null;
    },
    set,
    get,
    update: (scope) => (name, value) => {
      const existingScope = resolveVarScope(name, scope);
      existingScope.vars[name] = value;
      return value;
    },
    print: (_) => (...args) => {
      console.log(...args.map(stringify));
      return null;
    },
    return: (_) => (v) => v,
    fun: (scope) => (name, body) => {
      let existingFn;
      try {
        existingFn = resolveFn(name, scope);
      } catch (e) {}
      if (existingFn) {
        throw new Error(`Function '${name}' is already defined`);
      }
      scope.fns[name] = (fnScope) => (...args) => {
        // Setup Bind Function
        const newScope = getNewScope(fnScope);
        newScope.fns.bind = (bindScope) => (...names) => {
          names.forEach((name, i) => set(bindScope)(name, args[i] || null));
          return null;
        };
        return evalRuleSet(body, newScope);
      };
      return scope.fns[name];
    },
    scope: (scope) => (_) => {
      console.log(scope);
      return null;
    },
    if: (scope) => (cond, then, thenRS, el, elseRS) => {
      if (then !== "then") {
        throw new Error("Second argument to \"if\" should be the word 'then'");
      }
      if (!thenRS || thenRS.type !== "RuleSet") {
        throw new Error(
          'Third argument to "if" should be a RuleSet. It will execute when the condition succeeds'
        );
      }
      if (el || elseRS) {
        if (el !== "else") {
          throw new Error(
            "Fourth argument to \"if\" should be the word 'else'"
          );
        }
        if (!elseRS || elseRS.type !== "RuleSet") {
          throw new Error(
            'Fifth argument to "if" should be a RuleSet. It will execute when the condition fails'
          );
        }
      }

      if (cond) {
        return evalRuleSet(thenRS, scope);
      } else {
        return evalRuleSet(elseRS, scope);
      }
    },
  },
});
