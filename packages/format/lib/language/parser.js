"use strict";

const parser = require("@browselang/parser");

const createError = require("../common/parser-create-error");

function removeTokens(node) {
  if (node && typeof node === "object") {
    for (const key in node) {
      removeTokens(node[key]);
    }
    delete node.sourceString;
  }
  return node;
}

function parse(text /*, parsers, opts*/) {
  try {
    const ast = parser.parse(text);
    removeTokens(ast);
    return ast;
  } catch (e) {
    if (e.pos) {
      throw createError(e, {
        start: { line: e.pos.lineNum, column: e.pos.colNum },
      });
    } else {
      throw e;
    }
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
