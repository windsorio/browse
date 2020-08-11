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

module.exports = { stringify };
