"use strict";

const formatter = require("@browselang/format");

const fs = require("fs");
const path = require("path");

const { stringifyError } = require("@browselang/core");
const parser = require("@browselang/parser");

exports.command = "format <script>";
exports.handler = "Format a browse script";
exports.builder = (yargs) => {
  yargs
    .option("check", {
      type: "boolean",
      alias: "c",
      default: false,
      description:
        "Check if a file has been formatted correctly. Exit with a non-zero code if the file is not formatted",
    })
    .option("write", {
      type: "boolean",
      alias: "w",
      default: false,
      description:
        "Write the formatted output back to the file, overwriting its contents",
    });
};

exports.handler = async (argv) => {
  const { script, write, check } = argv;

  if (write && check) {
    console.error(
      "The --write and --check options cannot be used simultaneously"
    );
  }

  const document = path.resolve(process.cwd(), script);
  try {
    const code = fs.readFileSync(document, "utf8");

    const data = formatter.formatWithCursor(code, {
      parser: "browse",
      plugins: [],
    });

    if (check) {
      if (data.formatted !== code) {
        console.error("The code is not formatted correctly");
        process.exit(1);
      }
    } else if (write) {
      fs.writeFileSync(document, data.formatted);
    } else {
      console.log(data.formatted);
    }
  } catch (err) {
    process.stderr.write(
      stringifyError(err, {
        document,
        snippet: true,
        color: process.stderr.isTTY,
      })
    );
    process.stderr.write("\n");
  }
};
