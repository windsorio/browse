"use strict";

const getPageScope = require("./page");
const { getWebScope, destroyWebScope } = require("./web");

module.exports = {
  getWebScope: (parent) => getPageScope(getWebScope(parent)),
  destroyWebScope,
};
