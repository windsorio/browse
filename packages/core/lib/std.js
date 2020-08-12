const {
  resolveFn,
  resolveFnScope,
  resolveVar,
  resolveVarScope,
} = require("./scope");
const { help, stringify } = require("./utils");

const get = (scope) => (name) => resolveVar(name, scope);
const set = (scope) => (name, value) => {
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
          get:
            "<key> - Get the value of the variable 'key'. When using this rule as an expression - i.e. (get var), you may use the shorthand '$var' instead",
          set: "<key> <value> - Set the variable 'key' to the value 'value'",
          print: "<...vals> - Print values to stdout",
          fun: `<name> <body> - Define a new function 'name'. The 'body' has access to two additional functions, 'bind' and 'return' to take arguments and return a value
                    bind <...keys> - for each value passed into the function, store it as a variable using the names passed by 'keys'
                    return <value> - return the value`,
          if: `<condition> then <then> else <else> - If 'condition' is truthy, evaluate the 'then' RuleSet, else evaluate the 'else' rule set`,
          scope: "Internal: debug functions to print the current JS scope",
        },
      });
      return null;
    },
    get,
    set,
    print: (_) => (...args) => {
      console.log(...args.map(stringify));
      return null;
    },
    fun: (scope) => (name, body) => {
      let existingFn;
      try {
        existingFn = resolveFn(name, scope);
      } catch (e) {}
      if (existingFn) {
        throw new Error(`Function '${name}' is already defined`);
      }
      scope.fns[name] = (fnScope) => (...args) => {
        // Setup bind and return functions
        const newScope = getNewScope(fnScope);
        newScope.fns.bind = (bindScope) => (...names) => {
          names.forEach((name, i) => set(bindScope)(name, args[i] || null));
          return null;
        };
        newScope.fns.return = (_) => (v) => (v === undefined ? null : v);
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
