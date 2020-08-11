"use strict";

const test = require("ava");

const browse = require("..");

const expressions = [
  "true",
  "false",
  "null",
  "0",
  "1",
  "1.1",
  ["1.2e", "Line 1, col 4: expected end of input"],
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
  `(2 * (3 / -"muffin")) > null - false * true / null % "string" == "huh" * "wtf" / "this" != !"works?"`,
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
  ["1 === 1", "=== is not supported, use == instead"],
  ["1 !== 1", "!== is not supported, use != instead"],
  "$x + $y",
  "implicitString",
  "implicit\\ string",
  "https://implicit.url/something?q=123&term=implcit%20string#withAHash",
  "stringWith$dollarSign",
];

expressions.forEach((expr) => {
  if (typeof expr === "string") {
    expr = [expr];
  }
  const [source, ...errors] = expr;
  test(source, (t) => {
    const r = browse.grammar.match(source, "Expr");

    if (errors.length > 0) {
      if (r.succeeded()) {
        const n = browse.semantics(r);
        t.is(errors.length, n.errors.length);
        n.errors.forEach((err, i) => t.is(errors[i], err.message));
      } else {
        t.is(errors[0], r.shortMessage);
      }
    } else {
      if (r.succeeded()) {
        const n = browse.semantics(r);
        if (n.errors.length > 0) {
          return t.fail(n.errors[0].message);
        }
        t.snapshot(n.asLisp);
        t.snapshot(n.asAST);

        // Check interpret value
        console.log(source);
        console.log("  interpret(): %O", n.interpret());
      } else {
        t.fail(r.shortMessage);
      }
    }
  });
});
