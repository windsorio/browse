"use strict";

const test = require("ava");

const { evalRule, getNewScope } = require("..");

test("print", (t) => {
  evalRule(["print", ["hello", "world"]], getNewScope());
  t.pass();
});
