/**
 * Utility functions to create AST nodes
 */

exports.literal = (value, source = null, quoteType = null) => ({
  type: "Literal",
  value,
  source,
  quoteType,
});

// TODO: create more AST producer utilities, and expose these to consumers of
// @browselang/parser
