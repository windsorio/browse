"use strict";

const getPageScope = require("./page");
const getWebScope = require("./web");

module.exports = (parent) => getPageScope(getWebScope(parent));
