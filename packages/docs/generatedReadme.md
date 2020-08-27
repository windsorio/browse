# Documentation

- [Scope: Browser](#Browser)
  - [Rule: Page](#Page)
  - [Rule: Visit](#Visit)
- [Scope: page](#page)
  - [Config: output](#output)
  - [Config: writeStream](#writeStream)
- [Scope: std](#std)
  - [Rule: help](#help)
  - [Rule: scope](#scope)
  - [Rule: id](#id)
  - [Rule: get](#get)
  - [Rule: set](#set)
  - [Rule: update](#update)
  - [Rule: unset](#unset)
  - [Rule: push](#push)
  - [Rule: pop](#pop)
  - [Rule: rule](#rule)
  - [Rule: sleep](#sleep)
  - [Rule: print](#print)
  - [Rule: if](#if)
  - [Rule: for](#for)
  - [Rule: eval](#eval)
  - [Rule: arr](#arr)
  - [Rule: dict](#dict)
  - [Rule: import](#import)
  - [Rule: string](#string)

## Browser

A scope containing all the web-scraping functions and variables

### Rules

- ### Page:
  - Instantiates a page definition which matches on the url-pattern passed in as the first argument, and which executes the rule set passed in as the second argument on every matching page
- ### Visit:
  - Open a new tab/page with the given url and checks for matches on that URL. If there are matches the corresponding ruleSets will be run. If there is no match The new tab/page is opened in the browser scope and no actions will be taken

## page

A scope accessible within a `page` RuleSet

### Config

- #### output
  ( _string_ ) The file to output to
- #### writeStream
  ( _WriteStream_ ) A stream whose output is the file named by output

## std

The root scope that contains all the basic/standard functions and variables

### Rules

- ### help:
  - A function which prints help information
- ### scope:

- ### id:
  - Returns the value passed in
  - #### Parameters:
    - **value** ( _any_ ) Any value
  - #### Returns
    ( _any_ ) Retuns the value passed in
- ### get:
  - Get the value of the variable 'key'
  - #### Parameters:
    - **key** ( _string_ ) An identifer
  - #### Returns
    ( _any_ ) The value stored in the variable if there is one.
- ### set:
  - Set the variable 'key' to the value 'value'
  - #### Parameters:
    - **key** ( _string_ ) An identifer
    - **value** ( _any_ ) The value to set the variable to
  - #### Returns
    ( _any_ ) value
- ### update:
  - TODO
- ### unset:
  - Unset the variable 'key'
  - #### Parameters:
    - **key** ( _string_ ) An identifer
  - #### Returns
    ( _any_ ) The value stored in the variable key
- ### push:
  - Push an element to the back of an array
  - #### Parameters:
    - **value** ( _T_ ) The value to push
  - #### Returns
    ( _undefined_ ) undefined
- ### pop:

  - Remove the element at the back of the array and return it
  - #### Parameters:

  - #### Returns
    ( _undefined_ ) undefined

- ### rule:
  - Define a new rule 'name'. The 'body' has access to two additional rules, 'bind' and 'return' to take arguments and return a value
  - #### Parameters:
    - **name** ( _string_ ) An identifer
    - **body** ( _RuleSet_ ) The behavior that should be executed when rule is called with arguments
  - #### Returns
    ( _RuleSet_ ) The specified rule (TODO: Returns the entire function including a bunch of stuff that can only be used by the back end)
- ### sleep:
  - Sleep for the 'ms'
  - #### Parameters:
    - **ms** ( _number_ ) The number of ms to sleep for
  - #### Returns
    ( _number_ ) TODO: Should return the number of ms slept for
- ### print:

  - Print values to stdout
  - #### Parameters:

  - #### Returns
    ( _nil_ ) nil (TODO: Should return the string printed? something else but null)
  - #### example

```
TODO: Implement example
```

- #### Additional Notes
  > TODO: Implement additional notes
- ### if:
  - If 'condition' is truthy, evaluate the 'then' RuleSet, else evaluate the 'else' rule set
  - #### Parameters:
    - **thenRuleSet** ( _RuleSet_ ) The ruleset that will be executed if condition evaluates to true
    - **elseRuleSet** ( _RuleSet_ ) The ruleset that will be executed if condition evaluates to false
  - #### Returns
    ( _any_ ) The result of the if evaluated code
  - #### example

```
TODO: Implement example
```

- #### Additional Notes
  > TODO: Implement additional notes
- ### for:
  - Execute the body while the post iteration rule in the iterator is true
  - #### Parameters:
    - **iterator** ( _RuleSet_ ) The iteration criteria
    - **body** ( _RuleSet_ ) The body of the loop
  - #### Returns
    ( _nil_ ) nil (TODO: Should return the value of the last evaluated statement, or the number of iterations?)
  - #### example

```
for { set i 2; test $i < 5; set i $i + 1
```

- ### eval:
  - #### Parameters:
    - **ruleset** ( _RuleSet_ )
    - **inject** ( _RuleSet_ ) ???
  - #### Returns
    ( _any_ ) The result of evaluating the ruleset
  - #### example

```
TODO: Implement example
```

- #### Additional Notes
  > TODO: Implement additional notes
- ### arr:
  - Interpret ruleset as array
- ### dict:
  - Interpret ruleset as dictionary
- ### import:
  - Import passed in modules
- ### string:
  - create string from value
