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

/**
 * @scope { This scope is available to every program and consists of all the core rules to write useful browse programs }
 */
module.exports = ({ evalRule, evalRuleSet, getNewScope }) => ({
  parent: null, // This is the root
  vars: {},
  internal: {},
  modules: {},
  close: async () => {},
  rules: {
    //* Run `help` in a repl, or add it to your code during debugging, to learn about all the rules you can use in a scope
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
          bind: `[Used within a rule definition] <...keys> - for each value passed into the rule, store it as a variable using the names passed by 'keys'`,
          return: `[Used within a rule definition] <value> - return the value`,
          if: `<condition> then <then> else <else> - If 'condition' is truthy, evaluate the 'then' RuleSet, else evaluate the 'else' rule set`,
          scope: "Internal: debug rule to print the current JS scope",
        },
      });
      return null;
    },
    //* Internal: this dumps the current JS scope to stdout for debugging
    scope: (scope) => (_) => () => {
      console.log(scope);
      return null;
    },
    /**
     * @desc { Returns whatever value is passed in. This is the _identity_ rule }
     * @params {
     *   [value: T] Any value
     * }
     * @return { [T] The value passed in, unchanged }
     */
    id: (_) => (_) => (v = null) => v,
    /**
     * @desc { Resolves to the value of the variable `key` }
     * @params {
     *   [key: string] An identifer
     * }
     * @return { [any] The value of `key` }
     * @throws { If the variable is not defined, an error is thrown }
     * @notes {
     *    The shorthand for this rule is `$<key>`. So, `$someVar` is the
     *    same as `(get someVar)`. The shorthand syntax is the preferred way to
     *    read a value.
     *  }
     */
    get: (scope) => (_) => (name) => resolveVar(name, scope),
    /**
     * @desc { Get the element at `index` in the `array` }
     * @params {
     *   [index: number] A valid 0-indexed position in the `array`
     *   [array: arr<T>] The array to lookup
     * }
     * @return { [T] The element at `index` in the `array` }
     * @throws { If the index is not valid or out of bounds, an error is thrown }
     */
    arr_get: (_) => (_) => (id, arr) => {
      const err = new Error(
        `Cannot get '${stringify(id)}' from ${stringify(arr)}`
      );
      if (Array.isArray(arr) && typeof id === "number") {
        const v = arr[id];
        if (v === undefined) {
          throw err;
        }
        return v;
      } else {
        throw err;
      }
    },
    /**
     * @desc { Get the value of `key` in the `dict` dictionary }
     * @params {
     *   [key: K] A valid key in the dictionary
     *   [dict: dict<K, V> ] The dictionary to lookup
     * }
     * @return { [V] The value of `key` in the `dict` dictionary }
     * @throws { If the key is not defined in the dictionary, an error is thrown }
     */
    dict_get: (_) => (_) => (name, dict) => {
      const err = new Error(
        `Cannot get '${stringify(name)}' from ${stringify(dict)}`
      );
      if (dict instanceof Map) {
        const v = dict.get(name);
        if (v === undefined) {
          throw err;
        }
        return v;
      } else {
        throw err;
      }
    },
    /**
     * @desc { sets to the value of the variable `key` to `value` }
     * @params {
     *   [key: string] An identifer (a.k.a variable name)
     *   [value: T] The value to set the variable to
     * }
     * @return { [T] value }
     * @notes {
     *    'set' always creates/updates the variable in the immediate/local scope.
     *    If a variable with the same name exists in a higher scope, it will be
     *    'shadowed', not updated. To update a variable instead of creating a
     *    new one, use the {@link update\} rule.
     * }
     */
    set: (scope) => (_) => (name, value = null) => {
      scope.vars[name] = value;
      return value;
    },
    /**
     * @desc { Set the element at `index` in the `array` to `value` }
     * @params {
     *   [index: number] A valid 0-indexed position in the `array`
     *   [value: T] The value to set in the array
     *   [array: arr<T>] The array to write to
     * }
     * @return { [T] The value }
     * @throws { If the index is not valid or out of bounds, an error is thrown }
     * @notes { To increase the size of the array, see {@link push\} or use the `array` library }
     */
    arr_set: (_) => (_) => (id, value = null, array) => {
      if (id < 0 || id >= array.length) {
        throw new Error(
          `Cannot set index ${id} in array of size ${array.length}`
        );
      }
      array[id] = value;
      return value;
    },
    /**
     * @desc { Set the value of `key` in the `dict` dictionary }
     * @params {
     *   [key: K] The key in the dictionary to set
     *   [value: V] The value to set `key` to in the dictionary
     *   [dict: dict<K, V> ] The dictionary to write to
     * }
     * @return { [V] The value }
     */
    dict_set: (_) => (_) => (name, value = null, dict) => {
      dict.set(name, value);
      return value;
    },
    /**
     * @desc { Unset the variable 'key' }
     * @params {
     *   [key: string] An identifer
     * }
     * @return { [any] The value stored in the variable key }
     */
    unset: (scope) => (_) => (name) => {
      let value = scope.vars[name];
      delete scope.vars[name];
      if (value === undefined) value = null;
      return value;
    },
    /**
     * @desc { Delete the key-value record matching `key` from the dictionary `dict` }
     * @params {
     *   [key: K] A valid key in dict
     *   [dict: dict<K, V> ] The dictionary to update
     * }
     * @return { [V] The value from the deleted pair }
     */
    dict_unset: (_) => (_) => (key, dict) => {
      let value = dict.get(key);
      dict.delete(key);
      if (value === undefined) value = null;
      return value;
    },
    /**
     * @desc { Updates the variable 'key' to the value 'value' }
     * @params {
     *   [key: string] An identifer (a.k.a variable name)
     *   [value: V] The value to set the variable to
     * }
     * @return { [V] value }
     * @notes {
     *    'update' updates the value for the variable `key` in the closest ancestor scope.
     *    If a variable with the name `key` already exists in the current scope, then
     *    `update` throws an error. You should use {@link set\} instead for such cases.
     * }
     * @throws { If the variable is defined in the local scope, an error is thrown telling you to use `set` instead }
     */
    update: (scope) => (_) => (name, value = null) => {
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
     * @desc { Push an element to the back of an array }
     * @params {
     *   [value: T] The value to push
     *   [dest: arr<T>] The array to push to
     * }
     * @return { [number] The number of elements in the array after pushing to it }
     */
    push: (_) => (_) => (value = null, dest) => dest.push(value),
    /**
     * @desc { Remove the element at the back of the array and return it }
     * @params {
     *   [dest: arr<T>] The array to remove an element from
     * }
     * @return { [T] The value of the element removed }
     */
    pop: (_) => (_) => (dest) => dest.pop(),
    /**
     * @desc { Define a new rule 'name'. The 'body' has access to two additional rules, {@link bind\} and {@link return\} used to take arguments and return a value }
     * @params {
     *   [name: string] An identifer to name the rule
     *   [body: RuleSet] The behavior that should be executed when rule is called with arguments
     * }
     * @return { [Rule] TODO: This value cannot be used by browse and is only understood by the runtime. Provide a better value }
     * @throws { If a rule already exists with the same name }
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
     * @desc { Sleep for 'ms' milliseconds }
     * @params {
     *   [ms: number] The number of milliseconds to sleep for
     * }
     * @return { [number] ms }
     * @notes { This is a blocking rule }
     */
    sleep: (_) => (_) => async (ms) => {
      // TODO: remove this check when we have static types
      if (typeof ms !== "number") throw new Error("Argument is a not a number");
      return new Promise((r) => setTimeout(r, ms)).then(() => ms);
    },
    /**
     * @desc { Print values to stdout }
     * @params {
     *   [...values: any] The values to print
     * }
     * @return { [any] The value of the last argument passed to print }
     * @example {
     *    # Hello World
     *    print Hello World
     *
     *    # Since 'print' evaluates to the last argument passed in, it makes
     *    # it easy to compose `print` when debuggin complicated expressions
     *    rule fact {
     *         bind x
     *         if $x <= 1 then { return $x \} else {
     *            return (print $x + '! =' $x * (fact $x - 1))
     *         \}
     *    \}
     *    fact 4
     *
     *    # output =
     *    # 2! = 2
     *    # 3! = 6
     *    # 4! = 24
     * }
     */
    print: (_) => (_) => (...args) => {
      console.log(args.map(stringify).join(" "));
      return args.slice(-1)[0];
    },
    /**
     * @desc { If 'condition' is truthy, evaluate the 'then' RuleSet, else evaluate the 'else' rule set }
     * @params {
     *   [condition: any] The condition to test
     *   [then: "then"] The string "then"
     *   [thenRuleSet: RuleSet] The ruleset that will be executed if condition evaluates to true
     *   ?[else: "else"] The string "else"
     *   ?[elseRuleSet: RuleSet] The ruleset that will be executed if condition evaluates to false
     * }
     * @return { [any] The result of the RuleSet that was evaluated code. `nil` is no `else` claus is provided }
     * @notes {
     *    If `else` and `elseRuleSet` are not provided, then nothing is evaluated if the `condition`
     *    is falsy. The entire `if` rule will evaluate to `nil` in this case
     * }
     * @example {
     *    if ($grade > 60) then { print pass } else { print fail }
     * }
     * @throws { errors thrown when evaluating the thenRuleSet or elseRuleSet }
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
     * @desc { Execute the `body` while the `test` expressions in the `interator` do not fail }
     * @params {
     *   [iterator: RuleSet] The iteration criteria
     *   [body: RuleSet] The body of the loop
     * }
     * @return { [nil] nil (TODO: Should return the value of the last evaluated statement, or the number of iterations?) }
     * @throws { Errors thrown by the iterator or body during evaluation }
     * @notes {
     *   The contents of the iterator is split into multiple parts:
     *   * The very first rule is evaluated once, at the beginning, to setup the loop.
     *     Usually used to set a iteration variable
     *   * The remaining rules, except the last rule, are evaulated at the start of each
     *     rule. A `test` rule is available here that causes the loop to end if the first
     *     argument passed to `test` is falsy
     *   * The last rule is run at the end of each loop, i.e. affter the `body` is evaluated,
     *     but before the `test` rules (previous point) are evaluated again. Usually use to
     *     increment the iteration variable defined in point 1
     * }
     * @example { for { set i 2; test $i < 5; set i $i + 1 \} { print loop $i \} }
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
     * @desc { Evaluate a RuleSet. Optionally, inject variables and additional rules into the evaluation context/scope }
     * @params {
     *   [ruleset: RuleSet] The RuleSet to evaluate
     *   ?[inject: RuleSet] A RuleSet that is evaluated in the scope before the ruleset is evaluated
     * }
     * @return { [any] The result of evaluating the ruleset }
     * @throws { Errors thrown by the ruleset during evaluation }
     * @notes {
     *    inject is used to add additional variables and rules that can be used by the Ruleset
     *    This is the "explicit" form of scope injection that's used to make a pleasant experience
     *    for someone using a given library. See `examples/advanced/custom_rules.browse` in the browse
     *    repo to see some good examples for this
     * }
     * @example {
     *    # See https://github.com/windsorio/browse/blob/master/examples/advanced/custom_rules.browse
     * }
     */
    eval: (_) => ({ reverse = false }) => async (ruleset, inject) => {
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
        return evalRuleSet(
          ruleset,
          {
            rules: newRules,
            vars: injectScope.vars,
            internal: injectScope.internal,
          },
          { reverse } // reverse is just a hack for now. The rules stdlib will replace this
        );
      } else {
        return evalRuleSet(ruleset, {}, { reverse });
      }
    },
    /**
     * @desc { Create an Array from a RuleSet }
     * @params {
     *   [ruleset: RuleSet] The RuleSet used to instantiate the array
     * }
     * @return { [arr<any>] The array }
     * @throws { Errors thrown by the ruleset during evaluation }
     * @notes {
     *    `arr` creates a new array, and then evaluates the RuleSet
     *    A rule called `el` is available inside this RuleSet. It takes one argument
     *    Each `el` call adds that element to the array before returning the final
     *    array.
     *
     *    `e` and `_` are aliases for `el`
     * }
     * @example {
     *    set a1 (arr { _ 1; _ 2; _ 3 \})
     *
     *    # nested arrays
     *    set a2 (arr {
     *      _ (arr {
     *        _ 1
     *      \})
     *    \})
     * }
     */
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
    /**
     * @desc { Create a Dictionary from a RuleSet }
     * @params {
     *   [ruleset: RuleSet] The RuleSet used to instantiate the dictionary
     * }
     * @return { [dict<K, V>] The dictionary }
     * @throws { Errors thrown by the ruleset during evaluation }
     * @notes {
     *    `dict` creates a new dictionary, and then evaluates the RuleSet
     *    A rule called `record` is available inside this RuleSet. It takes two arguments,
     *    a `key` and `value`. Each `record` call adds a new record to the dictionary
     *    mapping the `key` to the `value`. The final dictionary is `returned`.
     *
     *    `r` and `_` are aliases for `record`
     * }
     * @example {
     *    set o1 (dict { _ k1 v1; _ k2 v2 \})
     *
     *    # nested dictionaries
     *    set o2 (dict {
     *      _ k1 (dict {
     *        _ k2 v2
     *      \})
     *    \})
     * }
     */
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
    /**
     * @desc { Import a module. Read the [Browse Modules](#) guide for more info (TODO) }
     */
    import: (_) => (_) => async (...mods) => {
      // evalRule should catch imports and handle them specially
      throw new Error("Unexpected browse error");
    },
    /**
     * @desc { Serialize any value as a string }
     * @params {
     *  [value: any] Any value
     * }
     * @opts {
     *  [depth: number] The max depth when serializing nested arrays and dictionaries. If 0, there's no max depth
     * }
     * @returns { [string] A string representation of the value passed in }
     */
    string: (_) => ({ depth = 3 }) => (v) =>
      stringify(
        v,
        /*  number recusrively goes up till hitting the threshold of 3 */ depth
          ? 2 - depth
          : -Infinity
      ),
    /**
     * @desc { Get the length of the string or number of elements in an array }
     * @params {
     *  [value: string | array<any>] A string or array
     * }
     * @returns { [number] length of the string or the number of elements in an array }
     */
    len: (_) => (_) => (v) => v.length,
    replace: (_) => (_) => (search, replace, str) =>
      str.replace(search, replace),
  },
});

// Intentionally defined at the end for BrowseDoc

const defRule = (evalRuleSet) => (scope) => (_opts) => (name, body) => {
  scope.rules[name] = (_ruleEvalScope) => (ruleOpts) => (...args) =>
    // TODO: if body has `expects`, inject those from _ruleEvalScope
    evalRuleSet(body, {
      rules: {
        // TODO: bind should only be accessible at the top level
        /**
         * @rule { bind }
         * @scope { rule }
         * @desc {
         *    **Only used within a {@link rule\} body**
         *    'bind' lets the rule accept arguments. Strings passed to bind are used to
         *    assign variables that track the incoming values
         * }
         * @params {
         *    [...names: string] variables to assign for each incoming positional argument
         * }
         * @opts {[...names: true] every key used as an option is bound to
         *    the value of an option passed in with the same name. The value for
         *    each option passed to bin MUST be `true` as it gets ignore
         * }
         * @return { nil }
         * @example {
         *    # take 2 arguments and return the sum
         *    rule add { bind x y; return $x + $y \}
         *
         *    # accept options
         *    rule add2 {
         *      bind(print) x y
         *      set z $x + $y
         *      if $print then { print $z \} else { return $z \}
         *    \}
         * }
         */
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
        /**
         * @rule { return }
         * @scope { rule }
         * @desc {
         *    **Only used within a {@link rule\} body**
         *    'return' is often used to make the return value for a rule explicit. It's often
         *    unnecessary however since every rule uses the last evaluated value in its body
         *    as the return value anyway.
         * }
         * @params {
         *    [value: T] The value to return
         * }
         * @return { [T] The value passed in, unchanged }
         * @notes {
         *    The return rule doesn't work like `return` in other languages. `return` is just an
         *    alias for {@link id\} since the last value in a RuleSet is the implicit return value of the
         *    RuleSet. For example
         *
         *    ```
         *    rule f {
         *      return foo
         *      return bar
         *    \}
         *    ```
         *
         *    In browse, this is valid and the return value is "bar". `return foo` is the same as `id foo`
         *    Which basically does nothing (a.k.a it's a no-op). and the last rule in the body evaluates to
         *    "bar"
         * }
         */
        return: (_) => (_) => (v) => (v === undefined ? null : v),
      },
    });

  return scope.rules[name];
};
