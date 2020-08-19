/**
 * Utility functions to create AST nodes
 */

exports.literal = (value, source = null) => ({
  type: "Literal",
  value,
  source,
});
