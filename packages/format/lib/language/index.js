"use strict";

const createLanguage = require("../utils/create-language");
const parser = require("./parser");
const printer = require("./printer");
const options = require("./options");

const linguistBrowse = {
  name: "Browse",
  type: "programming",
  extensions: [".browse"],
  tmScope: "source.browse",
  aceMode: "text",
};

const languages = [
  createLanguage(linguistBrowse, () => ({
    since: "0.0.1",
    parsers: ["browse"],
    vscodeLanguageIds: ["browse"],
  })),
];

const printers = {
  browse: printer,
};

const parsers = {
  browse: parser,
};

module.exports = {
  languages,
  options,
  printers,
  parsers,
};
