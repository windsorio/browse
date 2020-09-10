> This was generated using BrowseDoc which is still very much a work in progress

# Table of Contents

- [Scope: std](#scope-std)
  - [`help`](#help)
  - [`scope`](#scope)
  - [`id value`](#id-value)
  - [`get key`](#get-key)
  - [`arr_get index array`](#arr_get-index-array)
  - [`dict_get key dict`](#dict_get-key-dict)
  - [`set key value`](#set-key-value)
  - [`arr_set index value array`](#arr_set-index-value-array)
  - [`dict_set key value dict`](#dict_set-key-value-dict)
  - [`unset key`](#unset-key)
  - [`dict_unset key dict`](#dict_unset-key-dict)
  - [`update key value`](#update-key-value)
  - [`push value dest`](#push-value-dest)
  - [`pop dest`](#pop-dest)
  - [`rule name body`](#rule-name-body)
  - [`sleep ms`](#sleep-ms)
  - [`print`](#print)
  - [`if condition then thenRuleSet else elseRuleSet`](#if-condition-then-thenRuleSet-else-elseRuleSet)
  - [`for iterator body`](#for-iterator-body)
  - [`eval ruleset inject`](#eval-ruleset-inject)
  - [`arr ruleset`](#arr-ruleset)
  - [`dict ruleset`](#dict-ruleset)
  - [`import`](#import)
  - [`string value`](#string-value)
  - [`len value`](#len-value)
- [Scope: rule](#scope-rule)
  - [`bind`](#bind)
  - [`return value`](#return-value)

## Scope `std`

This scope is available to every program and consists of all the core rules to write useful browse programs

## Rules

### `help`

Run `help` in a repl, or add it to your code during debugging, to learn about all the rules you can use in a scope

### `scope`

Internal: this dumps the current JS scope to stdout for debugging

### `id value`

- `value` \<**T**\> Any value

- Returns: \<**T**\> The value passed in, unchanged

Returns whatever value is passed in. This is the _identity_ rule

### `get key`

- `key` \<**string**\> An identifer

- Returns: \<**any**\> The value of `key`

Resolves to the value of the variable `key`

> The shorthand for this rule is `$<key>`. So, `$someVar` is the
> same as `(get someVar)`. The shorthand syntax is the preferred way to
> read a value.

### `arr_get index array`

- `index` \<**number**\> A valid 0-indexed position in the `array`

- `array` \<**arr\<T\>**\> The array to lookup

- Returns: \<**T**\> The element at `index` in the `array`

Get the element at `index` in the `array`

### `dict_get key dict`

- `key` \<**K**\> A valid key in the dictionary

- `dict` \<**dict\<K, V\>**\> The dictionary to lookup

- Returns: \<**V**\> The value of `key` in the `dict` dictionary

Get the value of `key` in the `dict` dictionary

### `set key value`

- `key` \<**string**\> An identifer (a.k.a variable name)

- `value` \<**T**\> The value to set the variable to

- Returns: \<**T**\> value

sets to the value of the variable `key` to `value`

> 'set' always creates/updates the variable in the immediate/local scope.
> If a variable with the same name exists in a higher scope, it will be
> 'shadowed', not updated. To update a variable instead of creating a
> new one, use the [update](#update-key-value) rule.

### `arr_set index value array`

- `index` \<**number**\> A valid 0-indexed position in the `array`

- `value` \<**T**\> The value to set in the array

- `array` \<**arr\<T\>**\> The array to write to

- Returns: \<**T**\> The value

Set the element at `index` in the `array` to `value`

> To increase the size of the array, see [push](#push-value-dest) or use the `array` library

### `dict_set key value dict`

- `key` \<**K**\> The key in the dictionary to set

- `value` \<**V**\> The value to set `key` to in the dictionary

- `dict` \<**dict\<K, V\>**\> The dictionary to write to

- Returns: \<**V**\> The value

Set the value of `key` in the `dict` dictionary

### `unset key`

- `key` \<**string**\> An identifer

- Returns: \<**any**\> The value stored in the variable key

Unset the variable 'key'

### `dict_unset key dict`

- `key` \<**K**\> A valid key in dict

- `dict` \<**dict\<K, V\>**\> The dictionary to update

- Returns: \<**V**\> The value from the deleted pair

Delete the key-value record matching `key` from the dictionary `dict`

### `update key value`

- `key` \<**string**\> An identifer (a.k.a variable name)

- `value` \<**V**\> The value to set the variable to

- Returns: \<**V**\> value

Updates the variable 'key' to the value 'value'

> 'update' updates the value for the variable `key` in the closest ancestor scope.
> If a variable with the name `key` already exists in the current scope, then
> `update` throws an error. You should use [set](#set-key-value) instead for such cases.

### `push value dest`

- `value` \<**T**\> The value to push

- `dest` \<**arr\<T\>**\> The array to push to

- Returns: \<**number**\> The number of elements in the array after pushing to it

Push an element to the back of an array

### `pop dest`

- `dest` \<**arr\<T\>**\> The array to remove an element from

- Returns: \<**T**\> The value of the element removed

Remove the element at the back of the array and return it

### `rule name body`

- `name` \<**string**\> An identifer to name the rule

- `body` \<**RuleSet**\> The behavior that should be executed when rule is called with arguments

- Returns: \<**Rule**\> TODO: This value cannot be used by browse and is only understood by the runtime. Provide a better value

Define a new rule 'name'. The 'body' has access to two additional rules, [bind](#bind) and [return](#return-value) used to take arguments and return a value

### `sleep ms`

- `ms` \<**number**\> The number of milliseconds to sleep for

- Returns: \<**number**\> ms

Sleep for 'ms' milliseconds

> This is a blocking rule

### `print`

- Returns: \<**any**\> The value of the last argument passed to print

Print values to stdout

```
# Hello World
print Hello World

# Since 'print' evaluates to the last argument passed in, it makes
# it easy to compose `print` when debuggin complicated expressions
rule fact {
     bind x
     if $x <= 1 then { return $x } else {
        return (print $x + '! =' $x * (fact $x - 1))
     }
}
fact 4

# output =
# 2! = 2
# 3! = 6
# 4! = 24

```

### `if condition then thenRuleSet else elseRuleSet`

- `condition` \<**any**\> The condition to test

- `then` \<**"then"**\> The string "then"

- `thenRuleSet` \<**RuleSet**\> The ruleset that will be executed if condition evaluates to true
  ?
- `else` \<**"else"**\> The string "else"
  ?
- `elseRuleSet` \<**RuleSet**\> The ruleset that will be executed if condition evaluates to false

- Returns: \<**any**\> The result of the RuleSet that was evaluated code. `nil` is no `else` claus is provided

If 'condition' is truthy, evaluate the 'then' RuleSet, else evaluate the 'else' rule set

> If `else` and `elseRuleSet` are not provided, then nothing is evaluated if the `condition`
> is falsy. The entire `if` rule will evaluate to `nil` in this case

```
if ($grade > 60) then { print pass
```

### `for iterator body`

- `iterator` \<**RuleSet**\> The iteration criteria

- `body` \<**RuleSet**\> The body of the loop

- Returns: \<**nil**\> nil (TODO: Should return the value of the last evaluated statement, or the number of iterations?)

Execute the `body` while the `test` expressions in the `interator` do not fail

> The contents of the iterator is split into multiple parts:
>
> - The very first rule is evaluated once, at the beginning, to setup the loop.
>   Usually used to set a iteration variable
> - The remaining rules, except the last rule, are evaulated at the start of each
>   rule. A `test` rule is available here that causes the loop to end if the first
>   argument passed to `test` is falsy
> - The last rule is run at the end of each loop, i.e. affter the `body` is evaluated,
>   but before the `test` rules (previous point) are evaluated again. Usually use to
>   increment the iteration variable defined in point 1

```
for { set i 2; test $i < 5; set i $i + 1 } { print loop $i }
```

### `eval ruleset inject`

- `ruleset` \<**RuleSet**\> The RuleSet to evaluate
  ?
- `inject` \<**RuleSet**\> A RuleSet that is evaluated in the scope before the ruleset is evaluated

- Returns: \<**any**\> The result of evaluating the ruleset

Evaluate a RuleSet. Optionally, inject variables and additional rules into the evaluation context/scope

> inject is used to add additional variables and rules that can be used by the Ruleset
> This is the "explicit" form of scope injection that's used to make a pleasant experience
> for someone using a given library. See `examples/advanced/custom_rules.browse` in the browse
> repo to see some good examples for this

```
# See https://github.com/windsorio/browse/blob/master/examples/advanced/custom_rules.browse

```

### `arr ruleset`

- `ruleset` \<**RuleSet**\> The RuleSet used to instantiate the array

- Returns: \<**arr\<any\>**\> The array

Create an Array from a RuleSet

> `arr` creates a new array, and then evaluates the RuleSet
> A rule called `el` is available inside this RuleSet. It takes one argument
> Each `el` call adds that element to the array before returning the final
> array.
>
> `e` and `_` are aliases for `el`

```
set a1 (arr { _ 1; _ 2; _ 3 })

# nested arrays
set a2 (arr {
  _ (arr {
    _ 1
  })
})

```

### `dict ruleset`

- `ruleset` \<**RuleSet**\> The RuleSet used to instantiate the dictionary

- Returns: \<**dict\<K, V\>**\> The dictionary

Create a Dictionary from a RuleSet

> `dict` creates a new dictionary, and then evaluates the RuleSet
> A rule called `record` is available inside this RuleSet. It takes two arguments,
> a `key` and `value`. Each `record` call adds a new record to the dictionary
> mapping the `key` to the `value`. The final dictionary is `returned`.
>
> `r` and `_` are aliases for `record`

```
set o1 (dict { _ k1 v1; _ k2 v2 })

# nested dictionaries
set o2 (dict {
  _ k1 (dict {
    _ k2 v2
  })
})

```

### `import`

Import a module. Read the [Browse Modules](#) guide for more info (TODO)

### `string value`

- `value` \<**any**\> Any value

Serialize any value as a string

### `len value`

- `value` \<**string | array\<any\>**\> A string or array

Get the length of the string or number of elements in an array

## Scope `rule`

## Rules

### `bind`

- Returns: \<**any**\> nil

'bind' lets the rule accept arguments. Strings passed to bind are used to assign variables that track the incoming values

```
# take 2 arguments and return the sum    rule add { bind x y; return $x + $y }    # accept options    rule add2 {      bind(print) x y      set z $x + $y      if $print then { print $z } else { return $z }    }
```

### `return value`

- `value` \<**T**\> The value to return
- Returns: \<**T**\> The value passed in, unchanged

'return' is often used to make the return value for a rule explicit. It's often unnecessary however since every rule uses the last evaluated value in its body as the return value anyway.

> The return rule doesn't work like `return` in other languages. `return` is just an alias for [id](#id-value) since the last value in a RuleSet is the implicit return value of the RuleSet. For example `rule f { return foo return bar }` In browse, this is valid and the return value is "bar". `return foo` is the same as `id foo` Which basically does nothing (a.k.a it's a no-op). and the last rule in the body evaluates to "bar"
