"use strict";

const fs = require("fs");
const path = require("path");

const ohm = require("ohm-js");

// Instantiate the grammar.
const contents = fs.readFileSync(path.join(__dirname, "browse.ohm"));
const g = ohm.grammars(contents).Browse;
const semantics = g.createSemantics();

// prettier-ignore
semantics.addAttribute('asLisp', {
  PriExpr_paren:    function(_l, e, _r) { return ["group", e.asLisp]; }, 

  UnaryExpr_not:    function(_, e)      { return ["!", e.asLisp]; },
  UnaryExpr_neg:    function(_, e)      { return ["-", e.asLisp]; },
  
  MultExpr_mul:     function(l, _, r)   { return ["*", l.asLisp, r.asLisp]; },
  MultExpr_div:     function(l, _, r)   { return ["/", l.asLisp, r.asLisp]; },
  MultExpr_mod:     function(l, _, r)   { return ["%", l.asLisp, r.asLisp]; },
  AddExpr_add:     function(l, _, r)   { return ["+", l.asLisp, r.asLisp]; },
  AddExpr_sub:     function(l, _, r)   { return ["-", l.asLisp, r.asLisp]; },
  CompExpr_ge:     function(l, _, r)   { return [">=", l.asLisp, r.asLisp]; },
  CompExpr_le:     function(l, _, r)   { return ["<=", l.asLisp, r.asLisp]; },
  CompExpr_gt:     function(l, _, r)   { return [">", l.asLisp, r.asLisp]; },
  CompExpr_lt:     function(l, _, r)   { return ["<", l.asLisp, r.asLisp]; },
  EqExpr_ne:     function(l, _, r)   { return ["!=", l.asLisp, r.asLisp]; },
  EqExpr_eq:     function(l, _, r)   { return ["==", l.asLisp, r.asLisp]; },
  
  identifier:    function(_)         { return this.sourceString; },
  literal:       function(_)         { return this.sourceString; },

  /*
    When you create an operation or an attribute, you can optionally provide a `_nonterminal`
    semantic action that will be invoked when your action dictionary does not have a method that
    corresponds to the rule that created a CST node. The receiver (`this`) of the _nonterminal
    method will be that CST node, and `_nonterminal`'s only argument will be an array that contains
    the children of that node.
  */
  _nonterminal:  function(children) {
    if (children.length === 1) {
      // If this node has only one child, just return the Lisp-like tree of its child. This lets us
      // avoid writing semantic actions for the `Exp`, `AddExp`, `MulExp`, `ExpExp`, and `PriExp`
      // rules.
      return children[0].asLisp;
    } else {
      // If this node doesn't have exactly one child, we probably should have handled it specially.
      // So we'll throw an exception to let us know that we're missing a semantic action for this
      // type of node.
      throw new Error("Uh-oh, missing semantic action for " + this.constructor);
    }
  },
  _terminal: function () { return this.sourceString },
});

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
