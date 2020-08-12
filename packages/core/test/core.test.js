"use strict";

const test = require("ava");

const { evalRule, getNewScope } = require("..");

test("print", async (t) => {
  await evalRule(
    {
      type: "Rule",
      fn: { type: "Word", name: "print" },
      args: [
        { type: "Literal", value: "hello" },
        { type: "Literal", value: "world" },
      ],
    },
    getNewScope()
  );
  t.pass();
});
