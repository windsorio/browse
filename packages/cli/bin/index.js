#!/usr/bin/env node

"use strict";

const util = require("util");

const { argv } = require("yargs")
  .alias("v", "version")
  .command("$0 [script]")
  .help("h")
  .alias("h", "help");

const { script } = argv;

const parser = require("@browselang/parser");

if (!script) {
  const readline = require("readline");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const rep = () => {
    rl.question("> ", (stmt) => {
      const r = parser.grammar.match(stmt, "Rule");
      if (r.succeeded()) {
        const n = parser.semantics(r);
        if (n.errors.length > 0) {
          rl.write("\u001b[31;1m");
          rl.write(n.errors[0].message);
          rl.write("\u001b[0m");
        } else {
          rl.write(util.inspect(n.asLisp, { colors: true, depth: null }));
          // rl.write(util.inspect(n.interpret(), { colors: true }));
        }
      } else {
        rl.write("\u001b[31;1m");
        rl.write(r.shortMessage);
        rl.write("\u001b[0m");
      }
      rl.write("\n");
      rep();
    });
  };
  rep();
} else {
  console.log(`Executing ${script}`);
}
