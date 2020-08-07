"use strict";

const fs = require("fs");
const path = require("path");

const ohm = require("ohm-js");

// Instantiate the grammar.
const contents = fs.readFileSync(path.join(__dirname, "browse.ohm"));
const g = ohm.grammars(contents).Browse;
const semantics = g.createSemantics();

semantics.addAttribute("errors", {
  EqExpr_neError(_l, o, _r) {
    return [
      {
        message: "!== is not supported. Use != instead.",
        source: o.source,
      },
    ];
  },
  EqExpr_eqError(_l, o, _r) {
    return [
      {
        message: "=== is not supported. Use == instead.",
        source: o.source,
      },
    ];
  },

  // Base Cases
  _iter(children) {
    const errors = children.map((c) => c.errors);
    return [].concat(...errors);
  },
  _nonterminal(children) {
    const errors = children.map((c) => c.errors);
    return [].concat(...errors);
  },
  _terminal() {
    return [];
  },
});

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
  literal:       function(_)         { return this.interpret(); },

  _nonterminal:  function(children) {
    if (children.length === 1) {
      return children[0].asLisp;
    } else {
      throw new Error("Missing semantic action for " + this.ctorName);
    }
  },
  _terminal: function () { return this.sourceString },
});

// prettier-ignore
semantics.addOperation('interpret()', {
  PriExpr_paren:    function(_l, e, _r) { return e.interpret(); }, 

  UnaryExpr_not:    function(_, e)      { return !e.interpret(); },
  UnaryExpr_neg:    function(_, e)      { return - e.interpret(); },
  
  MultExpr_mul:     function(l, _, r)   { return l.interpret() * r.interpret(); },
  MultExpr_div:     function(l, _, r)   { return l.interpret()  /  r.interpret(); },
  MultExpr_mod:     function(l, _, r)   { return l.interpret()  %  r.interpret(); },
  AddExpr_add:     function(l, _, r)   { return l.interpret()  +  r.interpret(); },
  AddExpr_sub:     function(l, _, r)   { return l.interpret()  -  r.interpret(); },
  CompExpr_ge:     function(l, _, r)   { return  l.interpret() >=  r.interpret(); },
  CompExpr_le:     function(l, _, r)   { return  l.interpret() <=  r.interpret(); },
  CompExpr_gt:     function(l, _, r)   { return l.interpret()  >  r.interpret(); },
  CompExpr_lt:     function(l, _, r)   { return l.interpret()  <  r.interpret(); },
  EqExpr_ne:     function(l, _, r)   { return  l.interpret() !==  r.interpret(); },
  EqExpr_eq:     function(l, _, r)   { return  l.interpret() ===  r.interpret(); },
  
  nullLiteral: function(_)            { return null },
  booleanLiteral: function(_)         { return this.sourceString === "true" ? true : false; },
  numericLiteral: function(_)         { return Number(this.sourceString) },
  stringLiteral: function(l, c, _r)   { return c.sourceString },

  identifier:    function(_)         { return this.sourceString; },

  _nonterminal:  function(children) {
    if (children.length === 1) {
      return children[0].interpret();
    } else {
      throw new Error("Missing semantic action for " + this.constructor);
    }
  },
  // _terminal: function () { return this.sourceString },
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
