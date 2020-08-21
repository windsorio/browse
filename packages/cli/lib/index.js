"use strict";

const fs = require("fs");
const path = require("path");

const yargs = require("yargs");

const parser = require("@browselang/parser");
const {
  evalRule,
  getNewScope,
  evalRuleSet,
  stringify,
  stringifyError,
} = require("@browselang/core");

exports.command = "$0 [script]";
exports.describe = "Run browse";
exports.builder = (yargs) => {
  yargs.option("web", {
    type: "boolean",
    description: "Add web-scraping rules to the global scope",
  });
};

exports.handler = async (argv) => {
  const { script } = argv;

  if (script === "completion") {
    yargs.showCompletionScript();
    process.exit(0);
  }

  let scope = getNewScope();
  if (argv.web) {
    scope = require("@browselang/web")(scope);
  }

  async function closeAllScopes() {
    let c = scope;
    while (c) {
      await c.close();
      c = c.parent;
    }
  }

  if (!script) {
    const readline = require("readline");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const rep = () => {
      rl.question("> ", async (stmt) => {
        if (stmt === "quit") {
          if (argv.web) {
            const data = scope.internal.data;
            if (Object.keys(data).length) {
              data.url = await scope.internal.page.url();
              console.log(JSON.stringify(data));
            }
            await scope.parent.internal.browser.close();
          }
          rl.close();
          return;
        }
        try {
          const rules = parser.parse(stmt);
          const rule = rules[0];
          const out = stringify(await evalRule(rule, scope));
          process.stdout.write("\u001b[32m" + out + "\u001b[0m");
        } catch (e) {
          process.stderr.write(
            stringifyError(e, {
              document: "repl",
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
    try {
      const code = fs.readFileSync(document, "utf8").trim();
      if (!code) {
        process.exit(0); // empty program so skip
      }
      const rules = parser.parse(code);

      await evalRuleSet({
        type: "RuleSet",
        rules: rules,
        scope,
      });
    } catch (err) {
      process.stderr.write(
        stringifyError(err, {
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

  await closeAllScopes();
};
