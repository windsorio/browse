# Documentation

## Browser

### Rules

- ### Page

  #### Description

  Sets up a page definition

## std

### Rules

- ### help

  #### Description

  A function which prints help information

- ### scope
- ### get

  #### Description

  Get the value of the variable 'key'

  #### Parameters

      * __key__ ( _string_ ) An identifer

  #### Returns

  ( _any_ ) The value stored in the variable if there is one.

- ### set

  #### Description

  Set the variable 'key' to the value 'value'

  #### Parameters

      * __key__ ( _string_ ) An identifer
      * __value__ ( _any_ ) The value to set the variable to

  #### Returns

  ( _any_ ) value

- ### unset

  #### Description

  Unset the variable 'key'

  #### Parameters

      * __key__ ( _string_ ) An identifer

  #### Returns

  ( _any_ ) The value stored in the variable key

- ### rule

  #### Description

  Define a new rule 'name'. The 'body' has access to two additional rules, 'bind' and 'return' to take arguments and return a value

  #### Parameters

      * __name__ ( _string_ ) An identifer
      * __body__ ( _RuleSet_ ) The behavior that should be executed when rule is called with arguments

  #### Returns

  ( _RuleSet_ ) The specified rule (TODO: Returns the entire function including a bunch of stuff that can only be used by the back end)

- ### sleep

  #### Description

  Sleep for the 'ms'

  #### Parameters

      * __ms__ ( _number_ ) The number of ms to sleep for

  #### Returns

  ( _number_ ) TODO: Should return the number of ms slept for

- ### print

  #### Description

  Print values to stdout

  #### Parameters

      * __...values__ ( _Array<any>_ ) The values to print

  #### Returns

  ( _nil_ ) nil (TODO: Should return the string printed? something else but null)

  #### example

```
TODO: Implement example
```

#### Additional Notes

> TODO: Implement additional notes

- ### if

  #### Description

  If 'condition' is truthy, evaluate the 'then' RuleSet, else evaluate the 'else' rule set

  #### Parameters

      * __condition__ ( _Array<any>_ ) The values to print
      * __then__ ( _"then"_ ) The string constant then
      * __thenRuleSet__ ( _RuleSet_ ) The ruleset that will be executed if condition evaluates to true
      * __else__ ( _"else"_ ) The string constant else
      * __elseRuleSet__ ( _RuleSet_ ) The ruleset that will be executed if condition evaluates to false

  #### Returns

  ( _any_ ) The result of the if evaluated code

  #### example

```
TODO: Implement example
```

#### Additional Notes

> TODO: Implement additional notes

- ### for

  #### Description

  If 'condition' is truthy, evaluate the 'then' RuleSet, else evaluate the 'else' rule set

  #### Parameters

      * __iterator__ ( _RuleSet_ ) The iteration criteria
      * __body__ ( _RuleSet_ ) The body of the loop

  #### Returns

  ( _nil_ ) nil (TODO: Should return the value of the last evaluated statement, or the number of iterations? Not null.)

  #### example

```
TODO: Implement example
```

#### Additional Notes

> TODO: Implement additional notes
