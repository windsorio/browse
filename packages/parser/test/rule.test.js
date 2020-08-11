"use strict";

const test = require("ava");

const browse = require("..");

const programs = [
  `page "https://en.wikipedia.org/wiki/(slug:.+)" {
    string 'title' \`#firstHeading\`
    string 'summary' \`#mw-content-text > div > p:nth-child(4)\`
    arr 'headings' \`.mw-headline\` {
      string 'text' \`.span\`
      url 'mainArticle' \`a\` 'href'
    }
    crawl \`a\`
  }`,
];

programs.forEach((expr) => {
  if (typeof expr === "string") {
    expr = [expr];
  }
  const [source, ...errors] = expr;
  test(source, (t) => {
    const r = browse.grammar.match(source, "Rule");

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

        t.snapshot(n.interpret());

        // Check interpret value
        console.log(source);
        console.log("  interpret(): %O", n.interpret());
      } else {
        t.fail(r.shortMessage);
      }
    }
  });
});
