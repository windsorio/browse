#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const { argv } = require("yargs")
  .alias("v", "version")
  .command("$0 [script]")
  .help("h")
  .alias("h", "help");

const { script } = argv;

const parser = require("@browselang/parser");
const {
  evalRule,
  getNewScope,
  stringify,
  evalRuleSet,
} = require("@browselang/core");

const {
  evalAsyncRule,
  evalAsyncRuleSet,
  getNewScope: getWebScope,
} = require("../../web/lib/index.js");
(async () => {
  if (!script) {
    const readline = require("readline");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const scope = getNewScope();

    const webScope = getWebScope();
    webScope.parent.parent = scope.parent;

    const rep = () => {
      rl.question("> ", async (stmt) => {
        const r = parser.grammar.match(stmt, "Rule");
        if (r.succeeded()) {
          const n = parser.semantics(r);
          if (n.errors.length > 0) {
            rl.write("\u001b[31;1m");
            rl.write("Parse Error: " + n.errors[0].message);
            rl.write("\u001b[0m");
          } else {
            // rl.write(util.inspect(n.asLisp, { colors: true, depth: null }));
            // rl.write(util.inspect(n.interpret(), { colors: true, depth: null }));
            try {
              const out = stringify(await evalAsyncRule(n.asAST, webScope));
              rl.write("\u001b[32m");
              rl.write(out);
              rl.write("\u001b[0m");
            } catch (e) {
              rl.write("\u001b[31;1m");
              rl.write("Runtime Error: " + e.message);
              rl.write("\u001b[0m");
            }
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
    const code = fs.readFileSync(path.resolve(process.cwd(), script), "utf8");
    if (!code) {
      console.log(`Could not find any browse code at ${script}`);
    }

    const r = parser.grammar.match(code);
    if (r.succeeded()) {
      const n = parser.semantics(r);
      if (n.errors.length > 0) {
        process.stderr.write("\u001b[31;1m");
        n.errors.forEach((err) => {
          process.stderr.write(err[0].message);
          process.stderr.write("\n");
        });
        process.stderr.write("\u001b[0m");
      } else {
        try {
          await evalAsyncRuleSet({
            type: "RuleSet",
            rules: n.asAST,
          });
        } catch (e) {
          process.stderr.write("\u001b[31;1m");
          process.stderr.write(e.message);
          process.stderr.write("\u001b[0m");
          process.stderr.write("\n");
        }
      }
    } else {
      process.stderr.write("\u001b[31;1m");
      process.stderr.write(r.shortMessage);
      process.stderr.write("\u001b[0m");
      process.stderr.write("\n");
    }
  }
})();
