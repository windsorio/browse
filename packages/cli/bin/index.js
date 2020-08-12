#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const { argv } = require("yargs")
  .alias("v", "version")
  .command("$0 [script]", "Run browse", (yargs) => {
    yargs.option("web", {
      type: "boolean",
      description: "Add web-scraping function to the global context",
    });
  })
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

let scope = getNewScope();
if (argv.web) {
  scope = require("@browselang/web")(scope);
}

(async () => {
  if (!script) {
    const readline = require("readline");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const rep = () => {
      rl.question("> ", async (stmt) => {
        const r = parser.grammar.match(stmt, "Rule");
        if (r.succeeded()) {
          const n = parser.semantics(r);
          if (n.errors.length > 0) {
            process.stderr.write(
              "\u001b[31;1m" +
                "Parse Error: " +
                n.errors[0].message +
                "\u001b[0m"
            );
          } else {
            try {
              const out = stringify(await evalRule(n.asAST, scope));
              process.stdout.write("\u001b[32m" + out + "\u001b[0m");
            } catch (e) {
              process.stderr.write(
                "\u001b[31;1m" + "Runtime Error: " + e.message + "\u001b[0m"
              );
            }
          }
        } else {
          process.stderr.write("\u001b[31;1m" + r.shortMessage + "\u001b[0m");
        }
        process.stdout.write("\n");
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
          await evalRuleSet({
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
