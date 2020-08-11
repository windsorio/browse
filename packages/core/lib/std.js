const { resolveVar, resolveVarScope } = require("./scope");
const { stringify } = require("./utils");

/**
 * The root scope that contains all the basic/standard functions and variables
 */

module.exports = {
  parent: null, // This is the root
  vars: {},
  fns: {
    set: (scope) => (key, value) => {
      let existingVal;
      try {
        existingVal = resolveVar(key, scope);
      } catch (e) {}
      if (existingVal) {
        throw new Error(`Variable '${name}' is already defined`);
      }
      scope.vars[key] = value;
      return value;
    },
    update: (scope) => (key, value) => {
      const existingScope = resolveVarScope(key, scope);
      existingScope.vars[key] = value;
      return value;
    },
    print: (_) => (...args) => {
      console.log(...args.map(stringify));
      return null;
    },
  },
};
