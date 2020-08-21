#!/usr/bin/env node

"use strict";

const yargs = require("yargs");

const main = require("../lib/index");
const format = require("../lib/format");

const { argv } = yargs
  .alias("v", "version")
  .completion("completion", "Generate a completion script for bash or zsh")
  .command(format)
  .command(main)
  .help("h")
  .alias("h", "help");
