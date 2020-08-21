"use strict";

const formatter = require("@browselang/format");

const fs = require("fs");
const path = require("path");

const { stringifyError } = require("@browselang/core");
const parser = require("@browselang/parser");

exports.command = "format <script>";
exports.handler = "Format a browse script";
exports.builder = () => {};

exports.handler = async (argv) => {
  const { script } = argv;

  const document = path.resolve(process.cwd(), script);
  try {
    const code = fs.readFileSync(document, "utf8").trim();

    const data = formatter.formatWithCursor(code, {
      parser: "browse",
      plugins: [],
    });

    console.log(data.formatted);
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
