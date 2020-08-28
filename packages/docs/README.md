#TODO
@async
@author
@ignore
@see
@summary

# docs

In order for comments to be processed by the docs system they must begin with \*

Below these types of comments are referred to as 'starred' or 'starred comments' to differentiate them from ordinary comments

For ease of parsing, arguments are placed inside of

Examples

//\* @help { This is a random help annotation beginning with \* in a single line comment }

/\*\*
@help { This is a random help annotation beginning with \* in a multiline comment }
\*/

Types of annotations

##Above the getNewScope function

@scope { Description of scope here }

@name { The name of the scope }

In the absense of a name, the file name without extensions will be used

WARNING: THIS TAG IS REQUIRED FOR MOST THINGS TO WORK

##Above any of the config variables

@help { A description of what the variable does }
In the absense of @help, the value of the description is an empty string

@type { The type of the config variable }
In the absense of @type, we will attempt to grab the type of the initialized variable. If it is non-null we will set the type to be that type
For example in the case of

In the absense of the @help tag, the plaintext is taken to be the @help tag

Examples showing reason for design decisions. Some things are much simpler

config: {
/\*\* \* @help { Boolean indicating whether the browser should be run in headless mode } \* @type { Boolean }
\*/
headless: false
}

config: {
//\* Boolean indicating whether the browser should be run in headless mode
headless: false
}

These will both produce the same documentation because of automatic type evaluation and @help defaulting to plaintext

##Above any of the rules

If there is no 'starred' comment above a rule an assertion error will be thrown on doc creation with the name(s) of the uncommented function(s)

@ help { A short description of the function }
In the absense of @help, we will look for @description and if that is missing as well we use empty string as @help

@ description { A longer description of the function }
In the absense of @description, we will look for @help and if that is missing as well we use empty string as @description

@options { }

@params { }

@return { }
