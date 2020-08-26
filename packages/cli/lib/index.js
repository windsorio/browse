"use strict";

const fs = require("fs");
const path = require("path");

const yargs = require("yargs");

const parser = require("@browselang/parser");
const {
  evalRule,
  getNewScope,
  evalRuleSet,
  evalProgram,
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
          rl.close();
          return;
        }
        try {
          const program = parser.parse(stmt);
          const out = stringify(
            await evalProgram(program, {
              scope,
              document: "repl",
              basedir: process.cwd(),
            })
          );
          process.stdout.write("\u001b[32m" + out + "\u001b[0m");
        } catch (e) {
          process.stderr.write(
            stringifyError(e, {
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
      const code = fs.readFileSync(document, "utf8");
      const program = parser.parse(code);
      await evalProgram(program, {
        scope,
        document,
        basedir: path.dirname(document),
      });
    } catch (err) {
      process.stderr.write(
        stringifyError(err, {
          snippet: true,
          color: process.stderr.isTTY,
        })
      );
      process.stderr.write("\n");
    }
  }

  await closeAllScopes();
};
