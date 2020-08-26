# Documentation

## Browser

### Rules

- ### Page:
  -
  #### Description
  Sets up a page definition

## std

### Rules

- ### help:
  -
  #### Description
  A function which prints help information
- ### scope:

- ### get:
  -
  #### Description
  Get the value of the variable 'key'
  - #### Parameters:
  - - **key** ( _string_ ) An identifer
  - #### Returns
    ( _any_ ) The value stored in the variable if there is one.
- ### set:
  -
  #### Description
  Set the variable 'key' to the value 'value'
  - #### Parameters:
  - - **key** ( _string_ ) An identifer
- **value** ( _any_ ) The value to set the variable to
  - #### Returns
    ( _any_ ) value
- ### unset:
  -
  #### Description
  Unset the variable 'key'
  - #### Parameters:
  - - **key** ( _string_ ) An identifer
  - #### Returns
    ( _any_ ) The value stored in the variable key
- ### rule:
  -
  #### Description
  Define a new rule 'name'. The 'body' has access to two additional rules, 'bind' and 'return' to take arguments and return a value
  - #### Parameters:
  - - **name** ( _string_ ) An identifer
- **body** ( _RuleSet_ ) The behavior that should be executed when rule is called with arguments
  - #### Returns
    ( _RuleSet_ ) The specified rule (TODO: Returns the entire function including a bunch of stuff that can only be used by the back end)
- ### sleep:
  -
  #### Description
  Sleep for the 'ms'
  - #### Parameters:
  - - **ms** ( _number_ ) The number of ms to sleep for
  - #### Returns
    ( _number_ ) TODO: Should return the number of ms slept for
- ### print:
  -
  #### Description
  Print values to stdout
  - #### Parameters:
  - - **...values** ( _Array<any>_ ) The values to print
  - #### Returns
    ( _nil_ ) nil (TODO: Should return the string printed? something else but null)
  - #### example

```
TODO: Implement example
```

- #### Additional Notes
  > TODO: Implement additional notes
- ### if:
  -
  #### Description
  If 'condition' is truthy, evaluate the 'then' RuleSet, else evaluate the 'else' rule set
  - #### Parameters:
  - - **condition** ( _Array<any>_ ) The values to print
- **then** ( _"then"_ ) The string constant then
- **thenRuleSet** ( _RuleSet_ ) The ruleset that will be executed if condition evaluates to true
- **else** ( _"else"_ ) The string constant else
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
  -
  #### Description
  If 'condition' is truthy, evaluate the 'then' RuleSet, else evaluate the 'else' rule set
  - #### Parameters:
  - - **iterator** ( _RuleSet_ ) The iteration criteria
- **body** ( _RuleSet_ ) The body of the loop
  - #### Returns
    ( _nil_ ) nil (TODO: Should return the value of the last evaluated statement, or the number of iterations? Not null.)
  - #### example

```
TODO: Implement example
```

- #### Additional Notes
  > TODO: Implement additional notes
