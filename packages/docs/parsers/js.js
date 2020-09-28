const traverse = require("@babel/traverse").default;
const parser = require("@babel/parser");
const assert = require("assert");
const { pullTags, parseRtn, parseParams, processRule } = require("./common");

const split = (arr, n) => {
  const rtn = [];
  const length = arr.length;
  for (let i = 0; i < length; i += n) {
    rtn.push(arr.slice(i, i + n));
  }
  return rtn;
};

//Removes a bunch of extra stuff from block comments such as the newlines and the *'s
const cleanComment = (comment) =>
  comment.startsWith("*")
    ? comment
        .split("\n")
        .map((line) => line.split("*")[1])
        .filter(Boolean)
        .join("")
        .trim()
    : "";

const parseConfig = (configString) => {
  const rtn = {};
  split(configString.split(/[\[\]]/).slice(1), 2).map((arr) => {
    const [nameAndType, description] = arr;
    const [name, type] = nameAndType.split(":");
    if (!rtn[name.trim()]) {
      rtn[name.trim()] = {
        type: type.trim(),
        description: description.trim(),
      };
    } else {
      throw new Error(
        "Multiple variables of the same name defined in @config call. Check for typos"
      );
    }
  });
  return rtn;
};

/*
 * Process multiple rules inside an object
 *
 * A rule consists of a
 * {
 *   node,
 *   leadingComment,
 *   name
 * }
 */
const processRules = (rules) => {
  const rtn = {};
  const commentedRules = rules.filter(
    (rule) => rule.leadingComments !== undefined
  );
  if (rules.length != commentedRules.length) {
    const nonCommented = rules.filter(
      (rule) => rule.leadingComments === undefined
    );
    const singleRule = nonCommented.length === 1;
    const throwStr = `${singleRule ? "Rule" : "Rules"} ${nonCommented
      .map((node) => node.key.name)
      .join(", ")} ${singleRule ? `isn't` : `aren't`} commented`;
    throw new Error(throwStr);
  }

  commentedRules.forEach((rule) => {
    const ruleName = rule.key.name || rule.key.value;
    rtn[ruleName] = {};
    const tags = pullTags(rule.leadingComments);
    /* Parse the help tag */
    if (tags["@help"] === undefined && tags["@desc"] === undefined) {
      //If the help and desc tags have no data we grab all of the text
      //TODO: Return just the comments not within a tag
      rtn[ruleName].help = rule.leadingComments
        .map((node) => cleanComment(node.value))
        .join("\n");
    } else {
      //else we just extract data from @help tags
      rtn[ruleName].help = tags["@help"] || tags["@desc"];
    }

    /* Parse the desc tag */
    if (tags["@desc"] === undefined && tags["@help"] === undefined) {
      //If the help and desc tags have no data we grab all of the text
      //TODO: Return just the comments not within a tag
      rtn[ruleName].help = rule.leadingComments
        .map((node) => cleanComment(node.value))
        .join("\n");
    } else {
      //else we just extract data from @help tags
      rtn[ruleName].help = tags["@desc"] || tags["@help"];
    }

    /* Parse the params tag */
    if (tags["@params"] !== undefined) {
      rtn[ruleName].params = parseParams(tags["@params"]);
    }

    /* Parse the returns tag */
    if (tags["@return"] !== undefined) {
      rtn[ruleName].rtn = parseRtn(tags["@return"]);
    }

    /* Parse the example tag */
    if (tags["@example"] !== undefined) {
      rtn[ruleName].example = tags["@example"];
    }

    /* Parse the example tag */
    if (tags["@notes"] !== undefined) {
      rtn[ruleName].notes = tags["@notes"];
    }
  });
  return rtn;
};

const processConfig = (config) => {
  const rtn = {};
  if (config) {
    const properties = config.value.properties;

    //We first look for the @config annotation

    properties.map((property) => {
      //TODO: We should try to grab the name, type, and init value
      const propertyName = property.key.name;

      const tags = pullTags(property.leadingComments || []);

      if (tags["@config"] === undefined) {
        rtn[propertyName] = (property.leadingComments || [])
          .map((node) => cleanComment(node.value))
          .join("\n");
      }
      rtn[propertyName] = tags["@config"];
    });
  }
  return rtn;
};

const ObjectExpressionVisitor = {
  //It's more efficient to define only one visitor according to the babel docs so we switch

  ObjectExpression(path) {
    if (this.searchFor === "scope") {
      //Looking for a scope obj
      const ruleNode = path.node.properties.filter(
        (property) => property.key.name === "rules"
      );
      assert(ruleNode.length <= 1, "There can only be one fn property");

      /* Rule Annotations */
      if (ruleNode.length) {
        const rules = ruleNode[0].value.properties;
        this.rtn[this.scopeName]["rules"] = processRules(rules);
      } else {
        this.rtn[this.scopeName]["rules"] = {};
      }

      const internal = path.node.properties.filter(
        (property) => property.key.name === "internal"
      )[0];
      if (internal) {
        const configDeclarations = internal.value.properties.filter(
          (property) => property.key.name === "config"
        );

        assert(
          configDeclarations.length <= 1,
          "There can only be one config property"
        );

        /* Config Annotations */
        if (configDeclarations.length) {
          const config = configDeclarations[0];
          this.rtn[this.scopeName]["config"] = processConfig(config);
        } else {
          this.rtn[this.scopeName]["config"] = {};
        }
      }
      path.stop();
    } else if (this.searchFor === "config") {
      //Looking for a config Obj
    }
  },
};

module.exports = (code, fileName) => {
  const rtn = {};

  const ast = parser.parse(code);
  let scope;
  traverse(ast, {
    enter(path) {
      /*
       * This is for the 'const getBrowserScope = () => ({}) style
       */
      if (path.node.leadingComments !== undefined) {
        //Find the scope tag
        const tags = pullTags(path.node.leadingComments);

        // In the case of just a scope declaration.
        if (tags["@scope"] && tags["@rule"] === undefined) {
          assert(!scope, "There can only be one scope declaration per file");
          const scopeName = tags["@name"] || fileName;
          scope = scopeName;
          rtn[scopeName] = {};
          rtn[scopeName].description = tags["@scope"];
          // Whenever the @scope tag is defined, we look for the closest object
          // expression child for further parsing.
          path.traverse(ObjectExpressionVisitor, {
            rtn,
            scopeName,
            searchFor: "scope",
          });
        }

        //In the case of a rule definition which has been tagged with a scope
        else if (tags["@scope"] !== undefined && tags["@rule"] !== undefined) {
          const scopeName = (tags["@scope"] || scope || fileName).trim();
          let scopeObj = rtn;
          //In the case that this scope doesn't exist, we check for an @parent tag. If that doesn't exist we create a new scope
          if (!scopeObj[scopeName]) {
            //TODO: inference parent
            if (tags["@parent"]) {
              //TODO: Support arbitrarily nested scopes (currently supports one level of nesting)
              //If the parent exists We create a child scope
              if (!scopeObj[tags["@parent"]]) {
                console.warn(
                  `WARNING:: Parent Scope '${
                    scopeObj[tags["@parent"]]
                  }' for scope ${scopeName} does not exist. Creating new scope definition.`
                );
                scopeObj[tags["@parent"]] = {};
              }
              if (!scopeObj[tags["@parent"]]["children"]) {
                scopeObj[tags["@parent"]]["children"] = {};
              }
              scopeObj = scopeObj[tags["@parent"]]["children"];
              //Since this is a child scope, we don't need to print a warning
              if (!scopeObj[scopeName]) scopeObj[scopeName] = {};
            } else {
              console.warn(
                `WARNING:: Scope '${scopeName}' does not exist. Creating new scope definition.`
              );
              scopeObj[scopeName] = {};
            }
          }

          /* Deal with the Rule annotations */
          //Rules
          if (!scopeObj[scopeName]["rules"]) scopeObj[scopeName]["rules"] = {};

          scopeObj[scopeName]["rules"][tags["@rule"]] = processRule(
            path.node.leadingComments.map((comment) => ({
              ...comment,
              value: cleanComment(comment.value),
            }))
          );
        }

        // In the case of a config definition
        else if (tags["@config"] !== undefined) {
          const scopeName = (tags["@scope"] || scope || fileName).trim();
          // If there is a scope tag and a config tag we are dealing with a floating config definition
          rtn[scopeName]["config"] = parseConfig(tags["@config"]);
        }
      }
    },
  });

  return rtn;
};
