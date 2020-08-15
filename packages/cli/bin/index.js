#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const yargs = require("yargs");

const { argv } = yargs
  .alias("v", "version")
  .completion("completion", "Generate a completion script for bash or zsh")
  .command("$0 [script]", "Run browse", (yargs) => {
    yargs.option("web", {
      type: "boolean",
      description: "Add web-scraping function to the global context",
    });
  })
  .help("h")
  .alias("h", "help");
const { script } = argv;

if (script === "completion") {
  yargs.showCompletionScript();
  process.exit(0);
}

const parser = require("@browselang/parser");
const {
  evalRule,
  getNewScope,
  evalRuleSet,
  stringify,
  stringifyError,
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
        if (stmt === "quit") {
          const data = scope.internal.data;
          if (Object.keys(data).length) {
            data.url = await scope.internal.page.url();
            console.log(JSON.stringify(data));
          }
          rl.close();
          scope.parent.internal.browser.close();
          return;
        }
        const r = parser.grammar.match(stmt, "Rule");
        if (r.succeeded()) {
          const n = parser.semantics(r);
          if (n.errors.length > 0) {
            process.stderr.write(
              stringifyError(new Error(n.errors[0].message), {
                color: process.stderr.isTTY,
              })
            );
          } else {
            try {
              const out = stringify(await evalRule(n.asAST, scope));
              process.stdout.write("\u001b[32m" + out + "\u001b[0m");
            } catch (e) {
              process.stderr.write(
                stringifyError(e, {
                  document: "repl",
                  color: process.stderr.isTTY,
                })
              );
            }
          }
        } else {
          process.stderr.write(
            stringifyError(new Error(r.shortMessage), {
              color: process.stderr.isTTY,
            })
          );
        }
        process.stdout.write("\n");
        rep();
      });
    };
    rep();
  } else {
    const document = path.resolve(process.cwd(), script);
    const code = fs.readFileSync(document, "utf8");
    if (!code) {
      console.log(`Could not find any browse code at ${script}`);
    }

    const r = parser.grammar.match(code);
    if (r.succeeded()) {
      const n = parser.semantics(r);
      if (n.errors.length > 0) {
        n.errors.forEach((err) => {
          process.stderr.write(
            stringifyError(new Error(err.message), {
              color: process.stderr.isTTY,
            })
          );
          process.stderr.write("\n");
        });
      } else {
        try {
          await evalRuleSet(
            {
              type: "RuleSet",
              rules: n.asAST,
            },
            scope
          );
        } catch (e) {
          process.stderr.write(
            stringifyError(e, {
              /*
              TODO: Support multi-file stack traces (across imports)
              BODY: document should be extracted from the AST so we can support multi-file stack traces
              */
              document,
              snippet: true,
              color: process.stderr.isTTY,
            })
          );
          process.stderr.write("\n");
        }
      }
    } else {
      process.stderr.write(
        stringifyError(new Error(r.shortMessage), {
          color: process.stderr.isTTY,
        })
      );
      process.stderr.write("\n");
    }
  }
})();
