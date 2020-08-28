const {
  resolveRule,
  resolveRuleScope,
  resolveVar,
  resolveVarScope,
} = require("./scope");
const { isNullish, help, stringify } = require("./utils");
const { BrowseError } = require("./error");

// Rules that are not allowed to be overriden:
const IMMUTABLE_RULES = ["rule", "import", "id", "return", "eval"]; // if and for?

const defRule = (evalRuleSet) => (scope) => (_opts) => (name, body) => {
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
            boundScope.vars[opt] = isNullish(ruleOpts[opt])
              ? null
              : ruleOpts[opt];
          });
          names.forEach(
            (name, i) =>
              (boundScope.vars[name] = isNullish(args[i]) ? null : args[i])
          );
          return null;
        },
        // Same thing as id, but makes for better readability in rules
        return: (_) => (_) => (v) => (v === undefined ? null : v),
      },
    });

  return scope.rules[name];
};

/**
 * @scope { The root scope that contains all the basic/standard rules and variables }
 */
module.exports = ({
  evalRule,
  evalRuleSet,
  getNewScope,
  // evalArray,
}) => ({
  parent: null, // This is the root
  vars: {},
  internal: {},
  modules: {},
  close: async () => {},
  rules: {
    //* A function which prints help information
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
          rule: `<name> <body> - Define a new rule 'name'. The 'body' has access to two additional rules, 'bind' and 'return' to take arguments and return a value`,
          bind: `<...keys> - for each value passed into the rule, store it as a variable using the names passed by 'keys'`,
          return: `<value> - return the value`,
          if: `<condition> then <then> else <else> - If 'condition' is truthy, evaluate the 'then' RuleSet, else evaluate the 'else' rule set`,
          scope: "Internal: debug rule to print the current JS scope",
        },
      });
      return null;
    },
    //Logs the current scope
    scope: (scope) => (_) => () => {
      console.log(scope);
      return null;
    },
    /**
     * @desc { Returns the value passed in }
     * @params {
     *   [value: any] Any value
     * }
     * @return { [any] Retuns the value passed in }
     */
    id: (_) => (_) => (v) => (v === undefined ? null : v),
    /**
     * @desc { Get the value of the variable 'key' }
     * @params {
     *   [key: string] An identifer
     * }
     * @return { [any] The value stored in the variable if there is one. }
     * @throws { TODO: Implement Throws }
     */
    get: (scope) => (_) => (name, source) => {
      if (!source) {
        return resolveVar(name, scope);
      } else {
        const err = new Error(
          `Cannot get '${stringify(name)}' from ${stringify(source)}`
        );
        if (source instanceof Map) {
          const v = source.get(name);
          if (v === undefined) {
            throw err;
          }
          return v;
        } else if (Array.isArray(source) && typeof name === "number") {
          const v = source[name];
          if (v === undefined) {
            throw err;
          }
          return v;
        } else {
          throw err;
        }
      }
    },
    /**
     * @desc { Set the variable 'key' to the value 'value' }
     * @params {
     *   [key: string] An identifer
     *   [value: any] The value to set the variable to
     * }
     * @return { [any] value }
     */
    set: (scope) => (_) => (name, value, dest) => {
      if (!dest) {
        scope.vars[name] = value;
      } else if (dest instanceof Map) {
        dest.set(name, value);
      } else if (Array.isArray(dest) && typeof name === "number") {
        if (name < 0 || name >= dest.length) {
          throw new Error(
            `Cannot set index ${name} in array of size ${dest.length}`
          );
        }
        dest[name] = value;
      } else {
        throw new Error(
          `Cannot set '${stringify(name)}' in ${stringify(dest)}`
        );
      }
      return value;
    },
    /**
     * TODO
     */
    update: (scope) => (_) => (name, value) => {
      if (scope.vars[name] !== undefined) {
        throw new Error(
          `Variable '${stringify(
            name
          )}' is already defined in this scope. Use 'set' to update it. 'update' is only used to update variables that are outside of the current scope, like globals`
        );
      }
      const varScope = resolveVarScope(name, scope);
      varScope.vars[name] = value;
      return value;
    },
    /**
     * @desc { Unset the variable 'key' }
     * @params {
     *   [key: string] An identifer
     * }
     * @return { [any] The value stored in the variable key }
     */
    unset: (scope) => (_) => (name, from) => {
      let value;
      if (!from) {
        value = scope.vars[name];
        delete scope.vars[name];
      } else if (from instanceof Map) {
        value = from.get(name);
        from.delete(name);
      } else if (Array.isArray(from) && typeof name === "number") {
        if (name < 0 || name >= dest.length) {
          throw new Error(
            `Cannot unset index ${name} from array of size ${from.length}`
          );
        }
        value = from[name];
        delete from[name];
      } else {
        throw new Error(
          `Cannot unset '${stringify(name)}' from ${stringify(from)}`
        );
      }
      if (value === undefined) value = null;
      return value;
    },
    /**
     * @desc { Push an element to the back of an array }
     * @params {
     *   [value: T] The value to push
     *   [dest: Array<T>] The array to push to
     * }
     * @return { The number of elements in the array after pushing to it }
     */
    push: (_) => (_) => (value, dest) => dest.push(value),
    /**
     * @desc { Remove the element at the back of the array and return it }
     * @params {
     *   [dest: Array<T>] The array to remove an element from
     * }
     * @return { The value of the element removed }
     */
    pop: (_) => (_) => (dest) => dest.pop(),
    /**
     * @desc { Define a new rule 'name'. The 'body' has access to two additional rules, 'bind' and 'return' to take arguments and return a value }
     * @params {
     *   [name: string] An identifer
     *   [body: RuleSet] The behavior that should be executed when rule is called with arguments
     * }
     * @return { [RuleSet] The specified rule (TODO: Returns the entire function including a bunch of stuff that can only be used by the back end) }
     */
    rule: (scope) => (opts) => (name, body) => {
      let existingRule;
      try {
        existingRule = resolveRule(name, scope);
      } catch (e) {}
      if (existingRule) {
        throw new Error(`Rule '${name}' is already defined`);
      }
      return defRule(evalRuleSet)(scope)(opts)(name, body);
    },
    /**
     * @desc { Sleep for the 'ms' }
     * @params {
     *   [ms: number] The number of ms to sleep for
     * }
     * @return { [number] TODO: Should return the number of ms slept for }
     */
    sleep: (_) => (_) => async (ms) => {
      if (typeof ms !== "number") throw new Error("timeout is a not a number");
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    /**
     * @desc { Print values to stdout }
     * @params {
     *   [...values: Array<any>] The values to print
     * }
     * @return { [nil] nil (TODO: Should return the string printed? something else but null) }
     * @notes { TODO: Implement additional notes }
     * @example { TODO: Implement example }
     */
    print: (_) => (_) => (...args) => {
      console.log(args.map(stringify).join(" "));
      return null;
    },
    /**
     * @desc { If 'condition' is truthy, evaluate the 'then' RuleSet, else evaluate the 'else' rule set }
     * @params {
     *   [condition: Array<any>] The condition to be eevaluated
     *   [then: "then"] The string constant then
     *   [thenRuleSet: RuleSet] The ruleset that will be executed if condition evaluates to true
     *   [else: "else"] The string constant else
     *   [elseRuleSet: RuleSet] The ruleset that will be executed if condition evaluates to false
     * }
     * @return { [any] The result of the if evaluated code }
     * @notes { TODO: Implement additional notes }
     * @example { TODO: Implement example }
     */
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

      if (cond) {
        return evalRuleSet(thenRS);
      } else {
        if (elseRS) return evalRuleSet(elseRS);
        else return null;
      }
    },
    /**
     * @desc { Execute the body while the post iteration rule in the iterator is true }
     * @params {
     *   [iterator: RuleSet] The iteration criteria
     *   [body: RuleSet] The body of the loop
     * }
     * @opts {
     *   TODO: Implement optional arguments
     * }
     * @return { [nil] nil (TODO: Should return the value of the last evaluated statement, or the number of iterations?) }
     * @example { for { set i 2; test $i < 5; set i $i + 1 } { print loop $i }
 }
     */
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
    /**
     * @desc {   }
     * @params {
     *   [ruleset: RuleSet]
     *   [inject: RuleSet] ???
     * }
     * @opts {
     *   TODO: Implement optional arguments
     * }
     * @return { [any] The result of evaluating the ruleset }
     * @notes { TODO: Implement additional notes }
     * @example { TODO: Implement example }
     */
    eval: (_) => (_) => async (ruleset, inject) => {
      if (inject) {
        const injectScope = getNewScope(inject.scope);
        injectScope.rules.rule = (scope) => (opts) => (name, body) => {
          // This version of rule allows redifining existing rules
          if (IMMUTABLE_RULES.includes(name))
            throw new Error(`Cannot override the ${name} rule`);
          return defRule(evalRuleSet)(scope)(opts)(name, body);
        };
        await evalRuleSet(inject, injectScope);
        // We don't care about the return value, we just wanted to populate the
        // scope

        const { rule, ...newRules } = injectScope.rules;

        // And use it as the scope in which to eval ruleset
        return evalRuleSet(ruleset, {
          rules: newRules,
          vars: injectScope.vars,
          internal: injectScope.internal,
        });
      } else {
        return evalRuleSet(ruleset);
      }
    },
    //* Interpret ruleset as array
    arr: (_) => (_) => async (ruleset) => {
      const arr = [];
      const el = (_) => (_) => (value, extra) => {
        if (extra !== undefined && extra !== null) {
          throw new Error("'el' only takes 1 argument");
        }
        arr.push(value);
        return value;
      };
      await evalRuleSet(ruleset, {
        rules: { el, e: el, _: el },
      });

      return arr;
    },
    //* Interpret ruleset as dictionary
    dict: (_) => (_) => async (ruleset) => {
      const dict = new Map();
      const record = (_) => (_) => (key, value, extra) => {
        if (extra !== undefined && extra !== null) {
          throw new Error("'record' only takes 2 arguments");
        }
        if (dict.has(key)) {
          throw new Error(
            `Cannot define the same key twice - ${stringify(key)}`
          );
        }
        dict.set(key, value);
        return value;
      };
      await evalRuleSet(ruleset, {
        rules: { record, r: record, _: record },
      });

      return dict;
    },
    //* Import passed in modules
    import: (_) => (_) => async (...mods) => {
      // evalRule should catch imports and handle them specially
      throw new Error("Unexpected browse error");
    },
    //* create string from value
    string: (_) => (_) => (v) => String(v),
  },
});
