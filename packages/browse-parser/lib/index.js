"use strict";

const fs = require("fs");
const path = require("path");

const ohm = require("ohm-js");

// Instantiate the grammar.
const contents = fs.readFileSync(path.join(__dirname, "browse.ohm"));
const g = ohm.grammars(contents).Browse;
const semantics = g.createSemantics();

semantics.addOperation("something()", {
  //   _nonterminal: function(children) {
  //     return something(this, children);
  //   },
  _terminal: function () {
    return this.sourceString;
  },
});

module.exports = {
  grammar: g,
  semantics,
};
