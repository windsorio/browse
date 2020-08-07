"use strict";

const util = require("util");
const browse = require("..");

const expressions = [
  "true",
  "false",
  "null",
  "0",
  "1",
  "1.1",
  "1.2e",
  "1.2e5",
  "1.2e+5",
  "1.2e-5",
  "!true",
  "!false",
  "!1",
  "!0",
  "!!0",
  "-1",
  "-5",
  "!-5",
  "1 * 2",
  "22 / 7",
  "3 % 2",
  "-22 / 7",
  "1 + 1",
  "3 - 5",
  "-3 - 5",
  "- 3 - -5",
  "1 + 2 * 3",
  "(1 + 2) * 3",
  "1 + 2 - 3 * 4 / 5 % 6",
  "(1 + 2) < 4",
  "(1 + 2) < 3",
  "(1 + 2) <= 4",
  "(1 + 2) <= 3",
  "(1 + 2) > 4",
  "(1 + 2) > 3",
  "(1 + 2) >= 4",
  "(1 + 2) >= 3",
  "1 == 2",
  "1 != 2",
  `"a" == "a"`,
  `"a" != "a"`,
  `1 == "1"`,
  `"hi" == 'hi'`,
  `"hi" == \`hi\``,
  `"a\\nb \\
c"`,
  `'a\\nb \\
c'`,
  `\`a\\nb \\
c\``,
  `|a
b 
c|`,
  `"hi \\n" == |hi 
|`,
  `"hi \\
" == |hi 
|`,
  `(2 * (3 / -"muffin")) > null - false * true / null % "string" == "huh" * "wtf" / "this" != !"works?"`,
];

expressions.forEach((source) => {
  console.log(source);

  const r = browse.grammar.match(source, "Expr");

  if (r.succeeded()) {
    const n = browse.semantics(r);
    console.log(`  Lisp: ${util.inspect(n.asLisp, false, 10, true)}`);

    console.log("  Value: %O", n.interpret());
  } else {
    console.log(`\u001b[31;1m  ${r.shortMessage}\u001b[0m`);
  }
});

// describe("@browse/parser", () => {
//   it("needs tests");
// });
