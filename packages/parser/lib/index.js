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
        message: "!== is not supported, use != instead",
        source: o.source,
      },
    ];
  },
  EqExpr_eqError(_l, o, _r) {
    return [
      {
        message: "=== is not supported, use == instead",
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
  PriExpr_ruleExpr:  function(_l, e, _r) { return ["eval", e.asLisp]; }, 
  PriExpr_paren:  function(_l, e, _r) { return ["group", e.asLisp]; }, 

  UnaryExpr_not:  function(_, e)      { return ["!", e.asLisp]; },
  UnaryExpr_neg:  function(_, e)      { return ["-", e.asLisp]; },
  
  MultExpr_mul:   function(l, _, r)   { return ["*", l.asLisp, r.asLisp]; },
  MultExpr_div:   function(l, _, r)   { return ["/", l.asLisp, r.asLisp]; },
  MultExpr_mod:   function(l, _, r)   { return ["%", l.asLisp, r.asLisp]; },
  AddExpr_add:    function(l, _, r)   { return ["+", l.asLisp, r.asLisp]; },
  AddExpr_sub:    function(l, _, r)   { return ["-", l.asLisp, r.asLisp]; },
  CompExpr_ge:    function(l, _, r)   { return [">=", l.asLisp, r.asLisp]; },
  CompExpr_le:    function(l, _, r)   { return ["<=", l.asLisp, r.asLisp]; },
  CompExpr_gt:    function(l, _, r)   { return [">", l.asLisp, r.asLisp]; },
  CompExpr_lt:    function(l, _, r)   { return ["<", l.asLisp, r.asLisp]; },
  EqExpr_ne:      function(l, _, r)   { return ["!=", l.asLisp, r.asLisp]; },
  EqExpr_eq:      function(l, _, r)   { return ["==", l.asLisp, r.asLisp]; },

  Rule:           function(w, es)     { return [w.asLisp, es.asLisp] },
  Rules:          function (_nl, first, _rs, rest, _s) 
                                      {
                                        return [
                                          "seq",
                                          first.asLisp,
                                          ...rest.asLisp,
                                        ];
                                      },
  RuleSet_withRules(_l, r, _r)        { return r.asLisp },
  RuleSet_empty(_l, _r)               { return [] },

  word:          function(_)          { return this.sourceString; },
  identifier:    function(_, _name)   { return this.sourceString; },
  literal:       function(_)          { return this.interpret(); },

  // Base Cases
  _iter(children) {
    return children.map((c) => c.asLisp);
  },
  _nonterminal:  function(children) {
    if (children.length === 1) {
      return children[0].asLisp;
    } else {
      throw new Error("Missing semantic action for " + this.ctorName);
    }
  },
  _terminal: function () { return this.sourceString },
});

semantics.addAttribute("asAST", {
  PriExpr_ruleExpr: function (_l, e, _r) {
    return {
      type: "RuleExpr",
      expr: e.asAST,
    };
  },
  PriExpr_paren: function (_l, e, _r) {
    return {
      type: "Paren",
      expr: e.asAST,
    };
  },

  UnaryExpr_not: function (_, e) {
    return {
      type: "UnaryExpr",
      op: "!",
      expr: e.asAST,
    };
  },
  UnaryExpr_neg: function (_, e) {
    return {
      type: "UnaryExpr",
      op: "-",
      expr: e.asAST,
    };
  },

  MultExpr_mul: function (l, _, r) {
    return {
      type: "BinExpr",
      op: "*",
      left: l.asAST,
      right: r.asAST,
    };
  },
  MultExpr_div: function (l, _, r) {
    return {
      type: "BinExpr",
      op: "/",
      left: l.asAST,
      right: r.asAST,
    };
  },
  MultExpr_mod: function (l, _, r) {
    return {
      type: "BinExpr",
      op: "%",
      left: l.asAST,
      right: r.asAST,
    };
  },
  AddExpr_add: function (l, _, r) {
    return {
      type: "BinExpr",
      op: "+",
      left: l.asAST,
      right: r.asAST,
    };
  },
  AddExpr_sub: function (l, _, r) {
    return {
      type: "BinExpr",
      op: "-",
      left: l.asAST,
      right: r.asAST,
    };
  },
  CompExpr_ge: function (l, _, r) {
    return {
      type: "BinExpr",
      op: ">=",
      left: l.asAST,
      right: r.asAST,
    };
  },
  CompExpr_le: function (l, _, r) {
    return {
      type: "BinExpr",
      op: "<=",
      left: l.asAST,
      right: r.asAST,
    };
  },
  CompExpr_gt: function (l, _, r) {
    return {
      type: "BinExpr",
      op: ">",
      left: l.asAST,
      right: r.asAST,
    };
  },
  CompExpr_lt: function (l, _, r) {
    return {
      type: "BinExpr",
      op: "<",
      left: l.asAST,
      right: r.asAST,
    };
  },
  EqExpr_ne: function (l, _, r) {
    return {
      type: "BinExpr",
      op: "!=",
      left: l.asAST,
      right: r.asAST,
    };
  },
  EqExpr_eq: function (l, _, r) {
    return {
      type: "BinExpr",
      op: "==",
      left: l.asAST,
      right: r.asAST,
    };
  },

  Rule: function (w, es) {
    return {
      type: "Rule",
      fn: w.asAST,
      args: es.asAST,
    };
  },
  Rules: function (_nl, first, _rs, rest, _s) {
    return [first.asAST, ...rest.asAST];
  },
  RuleSet_withRules(_l, r, _r) {
    return {
      type: "RuleSet",
      rules: r.asAST,
    };
  },
  RuleSet_empty(_l, _r) {
    return {
      type: "RuleSet",
      rules: [],
    };
  },

  nullLiteral: function (_) {
    return {
      type: "Literal",
      value: null,
    };
  },
  booleanLiteral: function (_) {
    return {
      type: "Literal",
      value: this.sourceString === "true" ? true : false,
    };
  },
  numericLiteral: function (_) {
    return {
      type: "Literal",
      value: Number(this.sourceString),
    };
  },

  stringLiteral_doubleQuote: function (l, c, _r) {
    return {
      type: "Literal",
      value: c.sourceString,
    };
  },
  stringLiteral_singleQuote: function (l, c, _r) {
    return {
      type: "Literal",
      value: c.sourceString,
    };
  },
  stringLiteral_cssSelector: function (l, c, _r) {
    return {
      type: "Literal",
      value: c.sourceString,
    };
  },
  stringLiteral_javascript: function (l, c, _r) {
    return {
      type: "Literal",
      value: c.sourceString,
    };
  },
  stringLiteral_implicit: function (_f, _r) {
    return {
      type: "Literal",
      value: this.sourceString,
    };
  },

  word: function (_) {
    return {
      type: "Word",
      name: this.sourceString,
    };
  },
  identifier: function (_, _name) {
    return {
      type: "Ident",
      name: _name.sourceString,
    };
  },

  _iter(children) {
    return children.map((c) => c.asAST);
  },
  _nonterminal: function (children) {
    if (children.length === 1) {
      return children[0].asAST;
    } else {
      throw new Error("Missing semantic action for " + this.ctorName);
    }
  },
  // _terminal: function () { return this.sourceString },
});

// prettier-ignore
semantics.addOperation('interpret()', {
  PriExpr_ruleExpr:    function(_l, e, _r) { return e.interpret(); }, 
  PriExpr_paren:    function(_l, e, _r) { return e.interpret(); }, 

  UnaryExpr_not:    function(_, e)      { return !e.interpret(); },
  UnaryExpr_neg:    function(_, e)      { return - e.interpret(); },
  
  MultExpr_mul:     function(l, _, r)   { return l.interpret() * r.interpret(); },
  MultExpr_div:     function(l, _, r)   { return l.interpret()  /  r.interpret(); },
  MultExpr_mod:     function(l, _, r)   { return l.interpret()  %  r.interpret(); },
  AddExpr_add:     function(l, _, r)    { return l.interpret()  +  r.interpret(); },
  AddExpr_sub:     function(l, _, r)    { return l.interpret()  -  r.interpret(); },
  CompExpr_ge:     function(l, _, r)    { return  l.interpret() >=  r.interpret(); },
  CompExpr_le:     function(l, _, r)    { return  l.interpret() <=  r.interpret(); },
  CompExpr_gt:     function(l, _, r)    { return l.interpret()  >  r.interpret(); },
  CompExpr_lt:     function(l, _, r)    { return l.interpret()  <  r.interpret(); },
  EqExpr_ne:     function(l, _, r)      { return  l.interpret() !==  r.interpret(); },
  EqExpr_eq:     function(l, _, r)      { return  l.interpret() ===  r.interpret(); },

  Rule:           function(w, es)     { return [w.interpret(), es.interpret()] },
  Rules:          function (_nl, first, _rs, rest, _s) 
                                      {
                                        return [
                                          first.interpret(),
                                          ...rest.interpret(),
                                        ];
                                      },
  RuleSet_withRules(_l, r, _r)        { return r.interpret() },
  RuleSet_empty(_l, _r)               { return [] },
  
  nullLiteral: function(_)              { return null },
  booleanLiteral: function(_)           { return this.sourceString === "true" ? true : false; },
  numericLiteral: function(_)           { return Number(this.sourceString) },
  stringLiteral_doubleQuote: function(l, c, _r) { return c.sourceString },
  stringLiteral_singleQuote: function(l, c, _r) { return c.sourceString },
  stringLiteral_cssSelector: function(l, c, _r) { return c.sourceString },
  stringLiteral_javascript: function(l, c, _r) { return c.sourceString },
  stringLiteral_implicit: function(_f, _r) { return this.sourceString },

  word:          function(_)            { return this.sourceString; },
  identifier:    function(_, _name)     { return this.sourceString; },

  _iter(children) {
    return children.map((c) => c.interpret());
  },
  _nonterminal:  function(children) {
    if (children.length === 1) {
      return children[0].interpret();
    } else {
      throw new Error("Missing semantic action for " + this.ctorName);
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
