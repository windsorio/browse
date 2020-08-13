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

test("Unknown Operator", async (t) => {
  await evalRule(
    {
      type: "Rule",
      fn: { type: "Word", name: "print" },
      args: [
        {
          type: "UnaryExpr",
          op: "~",
          expr: null,
        },
      ],
    },
    getNewScope()
  );
});

test("undefined variable", async (t) => {
  await evalRule(
    {
      type: "Rule",
      fn: { type: "Word", name: "print" },
      args: [{ type: "Ident", name: "x" }],
    },
    getNewScope()
  );
});
