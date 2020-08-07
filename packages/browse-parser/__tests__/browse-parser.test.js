"use strict";

const util = require("util");
const browse = require("..");

const r = browse.grammar.match("1 + (2 * 3) / null >= false", "Expr");

const n = browse.semantics(r);
console.log(util.inspect(n.asLisp, false, 10, true));

// describe("@browse/parser", () => {
//   it("needs tests");
// });
