import fs from "fs";
import path from "path";

import ohm from "ohm-js";
const { getLineAndColumn } = require("ohm-js/src/util");
import { literal } from "./ast";
import parseComments from "./comments";
import EqExprErrorType from "./types/EqExprErrorType";

const genUnknownParseError = () =>
  new Error(
    "Browse encountered an error while parsing your script but was unable\nto identify the specific issue. Check the syntax carefully"
  );
const notUndefined = (v) => v !== undefined;

// Instantiate the grammar.
const contents = fs.readFileSync(path.join(__dirname, "browse.ohm"));
const g = ohm.grammars(contents.toString('utf8')).Browse;
const semantics = g.createSemantics();

semantics.addAttribute("errors", {
  EqExpr_neError(_l: ohm.Node, o: ohm.Node, _: ohm.Node, _r: ohm.Node) : EqExprErrorType[] {
    return [
      {
        message: "!== is not supported, use != instead",
        source: o.source,
      },
    ];
  },
  EqExpr_eqError(_l: ohm.Node, o: ohm.Node, _: ohm.Node, _r: ohm.Node) : EqExprErrorType[] {
    return [
      {
        message: "=== is not supported, use == instead",
        source: o.source,
      },
    ];
  },

  // TODO: this is a ohm.Node array with a custom property errors?
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

// get a list of all the nodes that include a `#` in their body so that the
// comment parser can ignore them
function getRange(_l, c, _r) {
  const { sourceString, _contents, ...range } = this.source;
  return /#/.test(this.sourceString) ? range : [];
}

semantics.addAttribute("forbiddenComments", {
  stringLiteral_doubleQuote: getRange,
  stringLiteral_singleQuote: getRange,
  stringLiteral_cssSelector: getRange,
  stringLiteral_javascript: getRange,
  stringLiteral_implicit(_c, _r) {
    return getRange.call(this);
  },
  _iter(children) {
    const forbiddenComments = children.map((c) => c.forbiddenComments);
    return [].concat(...forbiddenComments);
  },
  _nonterminal(children) {
    const forbiddenComments = children.map((c) => c.forbiddenComments);
    return [].concat(...forbiddenComments);
  },
  _terminal() {
    return [];
  },
});

// prettier-ignore
semantics.addAttribute('asLisp', {
  PriExpr_ruleExpr:  function(_l, _nl, e, _nr, _r) { return ["eval", e.asLisp]; }, 
  PriExpr_paren:  function(_l, _nl, e, _nr, _r) { return ["group", e.asLisp]; }, 

  UnaryExpr_not:  function(_, e)      { return ["!", e.asLisp]; },
  UnaryExpr_neg:  function(_, e)      { return ["-", e.asLisp]; },
  
  MultExpr_mul:   function(l, _op, _, r)   { return ["*", l.asLisp, r.asLisp]; },
  MultExpr_div:   function(l, _op, _, r)   { return ["/", l.asLisp, r.asLisp]; },
  MultExpr_mod:   function(l, _op, _, r)   { return ["%", l.asLisp, r.asLisp]; },
  AddExpr_add:    function(l, _op, _, r)   { return ["+", l.asLisp, r.asLisp]; },
  AddExpr_sub:    function(l, _op, _, r)   { return ["-", l.asLisp, r.asLisp]; },
  CompExpr_ge:    function(l, _op, _, r)   { return [">=", l.asLisp, r.asLisp]; },
  CompExpr_le:    function(l, _op, _, r)   { return ["<=", l.asLisp, r.asLisp]; },
  CompExpr_gt:    function(l, _op, _, r)   { return [">", l.asLisp, r.asLisp]; },
  CompExpr_lt:    function(l, _op, _, r)   { return ["<", l.asLisp, r.asLisp]; },
  EqExpr_ne:      function(l, _op, _, r)   { return ["!=", l.asLisp, r.asLisp]; },
  EqExpr_eq:      function(l, _op, _, r)   { return ["==", l.asLisp, r.asLisp]; },
  AndExpr_and:    function(l, _op, _, r)        { return ["&&", l.asLisp, r.asLisp]; },
  OrExpr_or:      function(l, _op, _, r)        { return ["||", l.asLisp, r.asLisp]; },

  ruleName:       function (m, _, n)       { return (m.asLisp ? m.asLisp + ":" : "") + n.asLisp; },

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
  RuleSet_empty(_l, _, _r)               { return [] },

  word:          function(_)          { return this.sourceString; },
  identifier:    function(_, _name)   { return this.sourceString; },
  literal:       function(_)          { return this.interpret(); },

  lineContinuation: function (_1, _2) { return; },

  // Base Cases
  _iter(children) {
    return children.map((c) => c.asLisp).filter(notUndefined);
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
  Program(c) {
    return {
      type: "Program",
      rules: c.asAST,
      source: this.source,
    };
  },
  PriExpr_ruleExpr: function (_l, _nl, e, _nr, _r) {
    return {
      type: "RuleExpr",
      expr: e.asAST,
      source: this.source,
    };
  },
  PriExpr_paren: function (_l, _nl, e, _nr, _r) {
    return {
      type: "Paren",
      expr: e.asAST,
      source: this.source,
    };
  },

  UnaryExpr_not: function (_, e) {
    return {
      type: "UnaryExpr",
      op: "!",
      expr: e.asAST,
      source: this.source,
    };
  },
  UnaryExpr_neg: function (_, e) {
    return {
      type: "UnaryExpr",
      op: "-",
      expr: e.asAST,
      source: this.source,
    };
  },

  MultExpr_mul: function (l, _op, _, r) {
    return {
      type: "BinExpr",
      op: "*",
      left: l.asAST,
      right: r.asAST,
      source: this.source,
    };
  },
  MultExpr_div: function (l, _op, _, r) {
    return {
      type: "BinExpr",
      op: "/",
      left: l.asAST,
      right: r.asAST,
      source: this.source,
    };
  },
  MultExpr_mod: function (l, _op, _, r) {
    return {
      type: "BinExpr",
      op: "%",
      left: l.asAST,
      right: r.asAST,
      source: this.source,
    };
  },
  AddExpr_add: function (l, _op, _, r) {
    return {
      type: "BinExpr",
      op: "+",
      left: l.asAST,
      right: r.asAST,
      source: this.source,
    };
  },
  AddExpr_sub: function (l, _op, _, r) {
    return {
      type: "BinExpr",
      op: "-",
      left: l.asAST,
      right: r.asAST,
      source: this.source,
    };
  },
  CompExpr_ge: function (l, _op, _, r) {
    return {
      type: "BinExpr",
      op: ">=",
      left: l.asAST,
      right: r.asAST,
      source: this.source,
    };
  },
  CompExpr_le: function (l, _op, _, r) {
    return {
      type: "BinExpr",
      op: "<=",
      left: l.asAST,
      right: r.asAST,
      source: this.source,
    };
  },
  CompExpr_gt: function (l, _op, _, r) {
    return {
      type: "BinExpr",
      op: ">",
      left: l.asAST,
      right: r.asAST,
      source: this.source,
    };
  },
  CompExpr_lt: function (l, _op, _, r) {
    return {
      type: "BinExpr",
      op: "<",
      left: l.asAST,
      right: r.asAST,
      source: this.source,
    };
  },
  EqExpr_ne: function (l, _op, _, r) {
    return {
      type: "BinExpr",
      op: "!=",
      left: l.asAST,
      right: r.asAST,
      source: this.source,
    };
  },
  EqExpr_eq: function (l, _op, _, r) {
    return {
      type: "BinExpr",
      op: "==",
      left: l.asAST,
      right: r.asAST,
      source: this.source,
    };
  },
  AndExpr_and: function (l, _op, _, r) {
    return {
      type: "BinExpr",
      op: "&&",
      left: l.asAST,
      right: r.asAST,
      source: this.source,
    };
  },
  OrExpr_or: function (l, _op, _, r) {
    return {
      type: "BinExpr",
      op: "||",
      left: l.asAST,
      right: r.asAST,
      source: this.source,
    };
  },

  Option_value(w, _, v) {
    return {
      type: "Option",
      key: w.asAST,
      value: v.asAST,
      source: this.source,
    };
  },
  Option_false(_, w) {
    return {
      type: "Option",
      key: w.asAST,
      value: literal(false),
      source: this.source,
    };
  },
  Option_true(w) {
    return {
      type: "Option",
      key: w.asAST,
      value: literal(true),
      source: this.source,
    };
  },

  Options(_leadingNL, opts, _endNL) {
    return opts.asAST;
  },

  InitRule_withOpts(w, _l, opts, _r) {
    const { module, name } = w.asAST;
    return {
      type: "InitRule",
      module,
      name,
      options: opts.asAST,
      source: this.source,
    };
  },
  InitRule_vanilla(w) {
    const { module, name } = w.asAST;
    return {
      type: "InitRule",
      module,
      name,
      options: [],
      source: this.source,
    };
  },

  Rule: function (w, es) {
    return {
      type: "Rule",
      fn: w.asAST,
      args: es.asAST,
      source: this.source,
    };
  },
  Rules: function (_nl, first, _rs, rest, _s) {
    return [first.asAST, ...rest.asAST];
  },
  RuleSet_withRules(_l, r, _r) {
    return {
      type: "RuleSet",
      rules: r.asAST,
      source: this.source,
    };
  },
  RuleSet_empty(_l, _, _r) {
    return {
      type: "RuleSet",
      rules: [],
      source: this.source,
    };
  },

  nilLiteral: function (_) {
    return literal(null, this.source);
  },
  booleanLiteral: function (_) {
    return literal(this.sourceString === "true" ? true : false, this.source);
  },
  numericLiteral: function (_) {
    return literal(Number(this.sourceString), this.source);
  },
  stringLiteral_doubleQuote: function (_l, c, _r) {
    return literal(c.sourceString, this.source, '"');
  },
  stringLiteral_singleQuote: function (_l, c, _r) {
    return literal(c.sourceString, this.source, "'");
  },
  stringLiteral_cssSelector: function (_l, c, _r) {
    return literal(c.sourceString, this.source, "`");
  },
  stringLiteral_javascript: function (_l, c, _r) {
    return literal(c.sourceString, this.source, "|");
  },
  stringLiteral_implicit: function (_f, _r) {
    return literal(this.sourceString, this.source, "");
  },

  ruleName: function (m, _, n) {
    return { module: m.asAST[0], name: n.asAST }; // This is not an AST node
  },
  word: function (_) {
    return {
      type: "Word",
      name: this.sourceString,
      source: this.source,
    };
  },
  identifier: function (_, _name) {
    return {
      type: "Ident",
      name: _name.sourceString,
      source: this.source,
    };
  },

  lineContinuation: function (_1, _2) {
    return;
  },

  _iter(children) {
    return children.map((c) => c.asAST).filter(notUndefined);
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
  PriExpr_ruleExpr:    function(_l, _sl, e, _sr, _r) { return e.interpret(); }, 
  PriExpr_paren:    function(_l, _sl, e, _sr, _r) { return e.interpret(); }, 

  UnaryExpr_not:    function(_, e)           { return !e.interpret(); },
  UnaryExpr_neg:    function(_, e)           { return - e.interpret(); },
  
  MultExpr_mul:     function(l, _op, _, r)   { return l.interpret() * r.interpret(); },
  MultExpr_div:     function(l, _op, _, r)   { return l.interpret()  /  r.interpret(); },
  MultExpr_mod:     function(l, _op, _, r)   { return l.interpret()  %  r.interpret(); },
  AddExpr_add:     function(l, _op, _, r)    { return l.interpret()  +  r.interpret(); },
  AddExpr_sub:     function(l, _op, _, r)    { return l.interpret()  -  r.interpret(); },
  CompExpr_ge:     function(l, _op, _, r)    { return  l.interpret() >=  r.interpret(); },
  CompExpr_le:     function(l, _op, _, r)    { return  l.interpret() <=  r.interpret(); },
  CompExpr_gt:     function(l, _op, _, r)    { return l.interpret()  >  r.interpret(); },
  CompExpr_lt:     function(l, _op, _, r)    { return l.interpret()  <  r.interpret(); },
  EqExpr_ne:     function(l, _op, _, r)      { return  l.interpret() !==  r.interpret(); },
  EqExpr_eq:     function(l, _op, _, r)      { return  l.interpret() === r.interpret(); },
  AndExpr_and:     function(l, _op, _, r)         { return  l.interpret() && r.interpret(); },
  OrExpr_or:     function(l, _op, _, r)         { return  l.interpret() || r.interpret(); },

  ruleName:       function (m, _, n)       { return n.interpret(); },

  Rule:           function(w, es)     { return [w.interpret(), es.interpret()] },
  Rules:          function (_nl, first, _rs, rest, _s) 
                                      {
                                        return [
                                          first.interpret(),
                                          ...rest.interpret(),
                                        ];
                                      },
  RuleSet_withRules(_l, r, _r)        { return r.interpret() },
  RuleSet_empty(_l, _, _r)               { return [] },
  
  nilLiteral: function(_)              { return null },
  booleanLiteral: function(_)           { return this.sourceString === "true" ? true : false; },
  numericLiteral: function(_)           { return Number(this.sourceString) },
  stringLiteral_doubleQuote: function(l, c, _r) { return c.sourceString },
  stringLiteral_singleQuote: function(l, c, _r) { return c.sourceString },
  stringLiteral_cssSelector: function(l, c, _r) { return c.sourceString },
  stringLiteral_javascript: function(l, c, _r) { return c.sourceString },
  stringLiteral_implicit: function(_f, _r) { return this.sourceString },

  word:          function(_)            { return this.sourceString; },
  identifier:    function(_, _name)     { return this.sourceString; },

  lineContinuation: function (_1, _2) { return; },

  _iter(children) {
    return children.map((c) => c.interpret()).filter(notUndefined);
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

const parse = (text) => {
  const r = g.match(text);
  if (!r.succeeded()) {
    let e;
    try {
      e = new Error(r.shortMessage);
    } catch (_) {
      e = genUnknownParseError();
    }
    const offset = r.getRightmostFailurePosition();
    e.pos = getLineAndColumn(text, offset);
    throw e;
  }

  const n = semantics(r);

  if (n.errors.length > 0) {
    const last = n.errors.slice(-1)[0];
    const e = new Error(last.message);
    e.pos = getLineAndColumn(text, last.source.startIdx);
    throw e;
  }

  const ast = n.asAST;
  ast.comments = parseComments(text, n.forbiddenComments);

  return ast;
};

module.exports = {
  grammar: g,
  semantics,
  parse,
};
