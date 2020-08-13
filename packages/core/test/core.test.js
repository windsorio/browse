"use strict";

const test = require("ava");

const { evalRule, getNewScope } = require("..");
const { BrowseError } = require("../lib/error");

const getBrowseErrorAssertion = (message) => ({
  instanceOf: BrowseError,
  name: "BrowseError",
  message,
});

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
  await t.throwsAsync(
    () =>
      evalRule(
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
      ),
    getBrowseErrorAssertion("Invalid unary operator '~'")
  );
});

test("undefined variable", async (t) => {
  await t.throwsAsync(
    () =>
      evalRule(
        {
          type: "Rule",
          fn: { type: "Word", name: "print" },
          args: [{ type: "Ident", name: "x" }],
        },
        getNewScope()
      ),
    getBrowseErrorAssertion("Variable 'x' is not defined")
  );
});

test("redefining a function", async (t) => {
  const fn = {
    type: "Rule",
    fn: { type: "Word", name: "fun" },
    args: [
      { type: "Literal", value: "f" },
      { type: "RuleSet", rules: [] },
    ],
  };
  const scope = getNewScope();
  await evalRule(fn, scope);
  await t.throwsAsync(
    () => evalRule(fn, scope),
    getBrowseErrorAssertion("Function 'f' is already defined")
  );
});
