"use strict";

const test = require("ava");

const { evalRuleSet, getNewScope } = require("@browselang/core");
const getWebScope = require("..");

const press = (key) => ({
  type: "Rule",
  fn: { type: "Word", name: "press" },
  args: [{ type: "Literal", value: key }],
});
const wait = (value) => ({
  type: "Rule",
  fn: { type: "Word", name: "wait" },
  args: [{ type: "Literal", value }],
});

test("page", async (t) => {
  const waitTime = {
    type: "Rule",
    fn: { type: "Word", name: "wait" },
    args: [{ type: "Literal", value: 5000 }],
  };

  const waitLogin = {
    type: "Rule",
    fn: { type: "Word", name: "wait" },
    args: [
      {
        type: "Literal",
        value:
          "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button",
      },
    ],
  };

  const clickLogin = {
    type: "Rule",
    fn: { type: "Word", name: "click" },
    args: [
      {
        type: "Literal",
        value:
          "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button",
      },
    ],
  };

  const waitPhone = {
    type: "Rule",
    fn: { type: "Word", name: "wait" },
    args: [
      {
        type: "Literal",
        value:
          "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button",
      },
    ],
  };

  const clickPhone = {
    type: "Rule",
    fn: { type: "Word", name: "click" },
    args: [
      {
        type: "Literal",
        value:
          "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button",
      },
    ],
  };

  const page = {
    type: "Rule",
    fn: { type: "Word", name: "page" },
    args: [
      { type: "Literal", value: "https://tinder.com" },
      {
        type: "RuleSet",
        rules: [
          waitTime,
          waitLogin,
          clickLogin,
          wait(
            "#modal-manager > div > div > div.Ta\\(c\\).Expand.Mx\\(a\\) > div.D\\(b\\).My\\(12px\\).My\\(24px\\)--ml.Mx\\(a\\) > div > input"
          ),
          ...[..."7406068968"].map(press),
          waitTime,
        ],
      },
    ],
  };

  const visit = {
    type: "Rule",
    fn: { type: "Word", name: "visit" },
    args: [{ type: "Literal", value: "https://tinder.com" }],
  };

  const res = await evalRuleSet(
    {
      type: "RuleSet",
      rules: [page, visit],
    },
    getWebScope(getNewScope())
  );
  console.log(res);
  t.pass();
});
