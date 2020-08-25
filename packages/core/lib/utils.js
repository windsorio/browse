/**
 * Convert a JS value to the corresponding browse value as a string. Used by the repl, or when printing a value
 * @param {any} jsValue Any JS Value
 * @returns browse string value
 */
const stringify = (jsValue, depth = 0) => {
  if (jsValue === undefined) {
    throw new Error(
      "The value was somehow 'undefined'. This should not be possible as browse doesn't have 'undefined'. There's an error with this browse implementation"
    );
  }
  if (jsValue === null) {
    return "nil";
  }
  if (typeof jsValue === "function") {
    return "rule ...";
  }

  const indent = new Array(depth + 1).join("  "); // indent
  // Arrays
  if (Array.isArray(jsValue)) {
    if (jsValue.size === 0) {
      return "arr { }";
    }
    if (depth > 2) {
      return "arr { ... }";
    }
    let out = "arr {\n";
    for (const v of jsValue) {
      out += indent + "  ";
      out += "_ " + stringify(v, depth + 1);
      out += "\n";
    }
    out += indent + "}";
    return out;
  }

  // Dictionaries
  if (jsValue instanceof Map) {
    const indent = new Array(depth + 1).join("  "); // indent

    if (jsValue.size === 0) {
      return "dict { }";
    }
    if (depth > 2) {
      return "dict { ... }";
    }
    let out = "dict {\n";
    for (const [k, v] of jsValue.entries()) {
      out += indent + "  ";
      out += "_ " + stringify(k, depth + 1) + " " + stringify(v, depth + 1);
      out += "\n";
    }
    out += indent + "}";
    return out;
  }
  return String(jsValue);
};

/**
 * Display a help message using the given function descriptions, and then recursively trigger parent help rules
 * @param {{rule: string]: string}} functions An object with a description for each rule
 */
const help = ({ resolveRule, scope, functions, key }) => {
  // TODO: probably accept the output stream as an arg so it can switch between
  // stdout and stderr, or just return the final string that needs to be printed
  // instead and let the caller decide how to output it
  if (!key) {
    Object.keys(functions).forEach((key) => {
      console.error(`${key.padEnd(10)} -\t${functions[key]}\n`);
    });
  } else {
    if (functions[key]) {
      console.error(`${key.padEnd(10)} -\t${functions[key]}\n`);
      return;
    }
  }
  if (scope.parent) {
    try {
      resolveRule("help", scope.parent)(scope.parent)(key);
    } catch (e) {}
  }
};

/**
 * Convert any error throwing function into a function that returns a Maybe
 * monad
 */
const throws = (fn) => (...args) => {
  try {
    return { success: true, value: fn(...args) };
  } catch (e) {
    return { success: false, err: e };
  }
};

module.exports = { stringify, help, throws };
