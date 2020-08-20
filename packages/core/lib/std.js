const { resolveRule, resolveRuleScope, resolveVar } = require("./scope");
const { help, stringify } = require("./utils");
const { BrowseError } = require("./error");

/**
 * The root scope that contains all the basic/standard rules and variables
 */
module.exports = ({ evalRule, evalRuleSet, getNewScope }) => ({
  parent: null, // This is the root
  vars: {},
  internal: {},
  close: async () => {},
  rules: {
    help: (scope) => (_) => (key) => {
      // Find the lowest scope that actually has the 'help' rule
      const helpScope = resolveRuleScope("help", scope);
      help({
        resolveRule,
        scope: helpScope,
        key,
        functions: {
          help:
            "Prints out help information about all the available rules. Pass an argument to get information on a specific rule",
          get:
            "<key> - Get the value of the variable 'key'. When using this rule as an expression - i.e. (get var), you may use the shorthand '$var' instead",
          set: "<key> <value> - Set the variable 'key' to the value 'value'",
          unset:
            "<key> - Unset the variable 'key', and return a value if there is one",
          sleep: "<ms> - Sleep for the specifed amount of milliseconds",
          print: "<...vals> - Print values to stdout",
          rule: `<name> <body> - Define a new rule 'name'. The 'body' has access to two additional rules, 'bind' and 'return' to take arguments and return a value
                    bind <...keys> - for each value passed into the rule, store it as a variable using the names passed by 'keys'
                    return <value> - return the value`,
          if: `<condition> then <then> else <else> - If 'condition' is truthy, evaluate the 'then' RuleSet, else evaluate the 'else' rule set`,
          scope: "Internal: debug rule to print the current JS scope",
        },
      });
      return null;
    },
    scope: (scope) => (_) => () => {
      console.log(scope);
      return null;
    },
    get: (scope) => (_) => (name) => resolveVar(name, scope),
    set: (scope) => (_) => (name, value) => {
      scope.vars[name] = value;
      return value;
    },
    unset: (scope) => (_) => (name) => {
      const value = scope.vars[name] || null;
      delete scope.vars[name];
      return value;
    },
    rule: (scope) => (_opts) => (name, body) => {
      let existingRule;
      try {
        existingRule = resolveRule(name, scope);
      } catch (e) {}
      if (existingRule) {
        throw new Error(`Rule '${name}' is already defined`);
      }
      scope.rules[name] = (_ruleEvalScope) => (ruleOpts) => (...args) =>
        // TODO: if body has `expects`, inject those from _ruleEvalScope
        evalRuleSet(body, {
          rules: {
            // TODO: bind should only be accessible at the top level
            bind: (boundScope) => (bindOpts) => (...names) => {
              Object.keys(bindOpts).forEach((opt) => {
                if (bindOpts[opt] !== true) {
                  throw new BrowseError({
                    message: `Options passed to bind can only have the value "true". Option '${opt}' has a different value`,
                  });
                }
                boundScope.vars[opt] = ruleOpts[opt] || null;
              });
              names.forEach(
                (name, i) => (boundScope.vars[name] = args[i] || null)
              );
              return null;
            },
            return: (_) => (_) => (v) => (v === undefined ? null : v),
          },
        });

      return scope.rules[name];
    },
    sleep: (_) => (_) => async (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms)),
    print: (_) => (_) => (...args) => {
      console.log(...args.map(stringify));
      return null;
    },
    if: (_) => (_) => (cond, then, thenRS, el, elseRS) => {
      if (then !== "then") {
        throw new Error("Second argument to 'if' should be the word 'then'");
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

      return evalRuleSet(cond ? thenRS : elseRS);
    },
    for: (_) => (_) => async (iterator, body) => {
      if (!iterator || iterator.type !== "RuleSet") {
        throw new Error(
          'Second argument to "for" should be a RuleSet containing the iteration criteria'
        );
      }
      if (!body || body.type !== "RuleSet") {
        throw new Error(
          'Third argument to "for" should be a RuleSet containing the body of the loop'
        );
      }

      const itLexScope = iterator.scope;
      const bodyLexScope = body.scope;

      // We share a single scope between the iterator and body, so we will keep
      // changing the parent on this to the correct lexical scope before
      // evaluating the iterator or body. Initially, it will inherit the
      // iterator's lexical scope
      const scope = getNewScope(itLexScope);

      // Prepare the iterator
      const iteratorRules = [...iterator.rules];
      const firstRule = iteratorRules.shift();
      const lastRule = iteratorRules.pop();

      // run the initialization rule
      try {
        await evalRule(firstRule, scope);
      } catch (err) {
        throw BrowseError.from(err, iterator);
      }

      while (true) {
        let finished = false;

        // run the iterator tests
        scope.parent = itLexScope;
        try {
          // This rule is added to the scope before each iterator evaluation
          // and remove after, so that it's not available in the body
          scope.rules.test = (_) => (_) => (expr) => (!!expr ? true : false);
          for (const rule of iteratorRules) {
            const result = await evalRule(rule, scope);
            if (rule.fn.name.name === "test" && !result) {
              finished = true; // ends the loop
              break; // Skip evaluating the rest
            }
          }
          delete scope.rules.test;
        } catch (err) {
          throw BrowseError.from(err, iterator);
        }

        if (finished) break;

        // Run the body
        scope.parent = bodyLexScope;
        await evalRuleSet(body, scope);

        // Run the post-iteration rule
        scope.parent = itLexScope;
        try {
          await evalRule(lastRule, scope);
        } catch (err) {
          throw BrowseError.from(err, iterator);
        }
      }
      return null;
    },
  },
});
