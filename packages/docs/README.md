#TODO
@async
@author
@ignore
@see
@summary
@param

# docs

## Getting started

      /**
      * @desc { A getting started function }
      * @params {
      *  [string: getting] : A description
      *  [string: started] : Of a parameter
      * }
      * @return { [string] returns "Getting started" }
      * @notes { This function is really simple
      * because we're just getting started }
      * @example { gettingStarted('Getting', 'Started') }
      */

Now lets break down some of the components of this example

## Valid BrowseDoc comments

Notice how the first line in the example begins with `/**` rather than the typical `/*` that indicates a block comment. In order for comments to be processed by the docs system they must begin with \*

Another Example

```
/**
* After /* and */ are parsed out, this comment begins with * and will be parsed by the documentation system.
*/

/*
  * This comment will be ignore by BrowseDoc
  */
```

Below these types of comments are referred to as 'starred' to differentiate them from ordinary comments

## Valid BrowseDoc Tags

Tags are an indication to BrowseDoc that the following text is special in some way. For readability, all text associated with a tag is placed inside of curly braces '{}'

Examples:

- The @desc tag indicates the 'description' of a function will follow.

```
  @desc { A getting started function }
```

- The @params tag indiciates the list of parameters for a function will follow.

```
@params {
  [string: getting] : A description
  [string: started] : Of a parameter
  }
```

## Tag Catalog

- ### Above the scope object

  - `@scope { Description of scope here }`

    - This tag is required. Files without any @scope tags are ignored

  - `@name { The name of the scope }`

    - In the absence of a name, the file name with the extension removed will be used for the name

- ### Above the config declaration

  - `@config { [type: varName]: description, ... }`

    - (TODO) All config variables must be documented or an error will be thrown

- ### Above a rule definition

  > If there is no starred comment above a rule within an object commented with an @scope tag, an assertion error will be thrown on doc generation with the name(s) of the uncommented function(s)

  - `@help { A short description of what the rule does }`

    - In the absense of @help, the value of the short description will default to @desc. If @desc also does not exist the plaintext of the comment will be used.

  - `@desc` { A longer description of what the rule does}

    - In the absense of @desc, the value of the long description will default to @help.

  - ```
    @params {
      [type1: param1] : Description of the first param
      [type2: param2] : Description of the second param
      ...
    }
    ```

  * `@rule { The name of the rule }`

    - The @rule tag is used to indicate that the following funciton or arrow funciton represets a rule. This is only necessary in the case that the rule is not in the rules array of a scope object.

  * `@scope { Name of the scope that the rule belongs to }`
    > WARNING: When used above a rule this must always be used in conjuction with the @rule tag!!
    - In the absense of @scope, if the rule belongs to the rules property of an object tagged with @scope, the scope of the rule is automatically set. Else the name of the scope defaults to the name of the file with the extension removed.

* `@return { [type] : A description of what is being returned}`

* `@notes { Extra notes on the rule that are non-obvious }`

* `@example { An example of usage of the documented rule }`

### Important implementation details

- The @rule tag uses nothing from the arrow function beneath it, so @rule tags can be placed anywhere. This might change in the future if we want to do more magical things.

- The @scope tag, when not paired with the @rule tag, works by looking for the nearest ObjectExpression child and interpreting that as a scope definition. We specifically look for rule and config attributes on the object and do special things with them.
