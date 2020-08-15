"use strict";

const test = require("ava");

const { evalRuleSet, getNewScope } = require("@browselang/core");
const { getWebScope, destroyWebScope } = require("..");

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

const waitForSelectors = (ruleset) => ({
  type: "Rule",
  fn: { type: "Word", name: "waitForSelectors" },
  args: [{ type: "RuleSet", value: ruleset }],
});

const click = (value, wait = false) => ({
  type: "Rule",
  fn: { type: "Word", name: "click" },
  args: [
    {
      type: "Literal",
      value,
    },
    {
      type: "Literal",
      value: wait,
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

const Paren = (expr) => ({
  type: "Paren",
  expr,
});
const RuleSet = (rules) => ({
  type: "RuleSet",
  rules,
});

const page = (hrefRegex, ruleSet) => ({
  type: "Rule",
  fn: { type: "Word", name: "page" },
  args: [{ type: "Literal", value: hrefRegex }, ruleSet],
});

test.serial("page", async (t) => {
  const waitTime = wait(5000);
  const agreeCookie = click(
    "#content > div > div.Pos\\(f\\).Start\\(0\\).End\\(0\\).Z\\(2\\).Bxsh\\(\\$bxsh-4-way-spread\\).B\\(0\\).Bgc\\(\\#fff\\).C\\(\\$c-secondary\\) > div > div > div:nth-child(1) > button"
  );
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
      agreeCookie,
      waitLogin,
      clickLogin,
      waitTextBox,
      type("7406068968"),
      waitTime,
    ])
  );

  const initVisit = visit("https://tinder.com");

  const wScope = getWebScope(getNewScope());
  const res = await evalRuleSet(RuleSet([tinderPage, initVisit]), wScope);
  console.log("Web Scope", wScope);
  destroyWebScope(wScope);
  console.log(res);
  t.pass();
});

test.serial("waitWithClick", async (t) => {
  const waitTime = wait(5000);
  const agreeCookie = click(
    "#content > div > div.Pos\\(f\\).Start\\(0\\).End\\(0\\).Z\\(2\\).Bxsh\\(\\$bxsh-4-way-spread\\).B\\(0\\).Bgc\\(\\#fff\\).C\\(\\$c-secondary\\) > div > div > div:nth-child(1) > button",
    true
  );
  const waitLogin = wait(
    "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button"
  );

  const clickLogin = click(
    "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button",
    true
  );

  const clickPhone = click(
    "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button",
    true
  );
  const waitTextBox = wait(
    "#modal-manager > div > div > div.Ta\\(c\\).Expand.Mx\\(a\\) > div.D\\(b\\).My\\(12px\\).My\\(24px\\)--ml.Mx\\(a\\) > div > input"
  );
  const tinderPage = page(
    "https://tinder.com",
    RuleSet([
      waitTime,
      agreeCookie,
      //      waitLogin,
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

test.serial("withWaitSelectors", async (t) => {
  const waitTime = wait(5000);
  const agreeCookie = click(
    "#content > div > div.Pos\\(f\\).Start\\(0\\).End\\(0\\).Z\\(2\\).Bxsh\\(\\$bxsh-4-way-spread\\).B\\(0\\).Bgc\\(\\#fff\\).C\\(\\$c-secondary\\) > div > div > div:nth-child(1) > button"
  );
  const clickLogin = click(
    "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button"
  );

  const waitTextBox = wait(
    "#modal-manager > div > div > div.Ta\\(c\\).Expand.Mx\\(a\\) > div.D\\(b\\).My\\(12px\\).My\\(24px\\)--ml.Mx\\(a\\) > div > input"
  );
  const tinderPage = page(
    "https://tinder.com",
    RuleSet([
      waitForSelectors(
        Paren(
          RuleSet([
            waitTime,
            agreeCookie,
            clickLogin,
            waitTextBox,
            type("7406068968"),
            waitTime,
          ])
        )
      ),
    ])
  );

  const initVisit = visit("https://tinder.com");

  const wScope = getWebScope(getNewScope());
  const res = await evalRuleSet(RuleSet([tinderPage, initVisit]), wScope);
  console.log("Web Scope", wScope);
  destroyWebScope(wScope);
  console.log(res);
  t.pass();
});
