/**
 * Convert a JS value to the corresponding browse value as a string. Used by the repl, or when printing a value
 * @param {any} jsValue Any JS Value
 * @returns browse string value
 */
const stringify = (jsValue) => {
  if (jsValue === undefined) {
    throw new Error(
      "The value was somehow 'undefined'. This should not be possible as browse doesn't have 'undefined'. There's an error with this browse implementation"
    );
  }
  if (jsValue === null) {
    return "nil";
  }
  if (typeof jsValue === "function") {
    return "Function";
  }
  return String(jsValue);
};

/**
 * Display a help message using the given function descriptions, and then recursively trigger parent help rules
 * @param {{rule: string]: string}} functions An object with a description for each rule
 */
const help = ({ resolveRule, scope, functions, key }) => {
  if (!key) {
    Object.keys(functions).forEach((key) => {
      console.log(`${key.padEnd(10)} -\t${functions[key]}\n`);
    });
  } else {
    if (functions[key]) {
      console.log(`${key.padEnd(10)} -\t${functions[key]}\n`);
      return;
    }
  }
  if (scope.parent) {
    try {
      resolveRule("help", scope.parent)(scope.parent)(key);
    } catch (e) {}
  }
};

module.exports = { stringify, help };
