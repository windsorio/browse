/**
 * Utility functions to create AST nodes
 */

exports.literal = (value, source = null) => ({
  type: "Literal",
  value,
  source,
});

// TODO: create more AST producer utilities, and expose these to consumers of
// @browselang/parser
