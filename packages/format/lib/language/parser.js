"use strict";

const parser = require("@browselang/parser");

const createError = require("../common/parser-create-error");

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
  try {
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
  } catch (e) {
    // TODO: get the real position from the parse error
    throw createError(e, {
      start: { line: e.pos.lineNum, column: e.pos.colNum },
    });
  }
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
