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

const click = (value) => ({
  type: "Rule",
  fn: { type: "Word", name: "wait" },
  args: [
    {
      type: "Literal",
      value,
    },
  ],
});

const visit = (value) => ({
  type: "Rule",
  fn: { type: "Word", name: "visit" },
  args: [{ type: "Literal", value }],
});

const type = (value) => ({
  type: "Rule",
  fn: { type: "Word", name: "type" },
  args: [
    {
      type: "Literal",
      value,
    },
  ],
});

const RuleSet = (rules) => ({
  type: "RuleSet",
  rules,
});

const page = (hrefRegex, ruleSet) => ({
  type: "Rule",
  fn: { type: "Word", name: "page" },
  args: [{ type: "Literal", value: hrefRegex }, RuleSet(ruleSet)],
});

test("page", async (t) => {
  const waitTime = wait(5000);
  const waitLogin = wait(
    "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button"
  );
  const clickLogin = click(
    "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button"
  );

  const waitPhone = wait(
    "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button"
  );

  const clickPhone = click(
    "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button"
  );
  const waitTextBox = wait(
    "#modal-manager > div > div > div.Ta\\(c\\).Expand.Mx\\(a\\) > div.D\\(b\\).My\\(12px\\).My\\(24px\\)--ml.Mx\\(a\\) > div > input"
  );
  const tinderPage = page(
    "https://tinder.com",
    RuleSet([
      waitTime,
      waitLogin,
      clickLogin,
      waitTextBox,
      type("7406068968"),
      waitTime,
    ])
  );

  const initVisit = visit("https://tinder.com");

  const res = await evalRuleSet(
    RuleSet([tinderPage, initVisit]),
    getWebScope(getNewScope())
  );
  console.log(res);
  t.pass();
});
