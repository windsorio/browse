"use strict";

const parser = require("@browselang/parser");

function parseComments(ast) {
  const comments = [];
  // TODO: parse comments
  return comments;
}

function removeTokens(node) {
  if (node && typeof node === "object") {
    // delete any unneeded tokens from the tree
    for (const key in node) {
      removeTokens(node[key]);
    }
  }
  return node;
}

function parse(text /*, parsers, opts*/) {
  const rules = parser.parse(text) || [];
  // TODO: that parser should return a Program node
  const ast = {
    type: "Program",
    rules,
    source: null,
  };
  ast.comments = parseComments(ast);
  // removeTokens(ast);
  return ast;
}

module.exports = {
  parse,
  astFormat: "browse",
  locStart(node) {
    return node.source.startIdx;
  },
  locEnd(node) {
    return node.source.endIdx;
  },
};
