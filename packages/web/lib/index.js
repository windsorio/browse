"use strict";

const getPageScope = require("./page");
const getBrowserScope = require("./browser");

module.exports = (parent) => getPageScope(getBrowserScope(parent));
