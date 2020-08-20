"use strict";

const {
  resolveInternal,
  resolveRule,
  resolveRuleScope,
  resolveInternalScope,
  validateScope,
} = require("@browselang/core/lib/scope");

const assertPageScope = (scope, message) => {
  if (!validateScope((scope) => scope.internal.isPage, scope)) {
    throw new Error(message);
  }
};

const { evalRule, evalRuleSet, getNewScope } = require("@browselang/core");
const { help } = require("@browselang/core/lib/utils");
const fs = require("fs-extra");

const dataStorageRule = (jsProcessing, type, optional = false) => (scope) => (
  _opts
) => async (key, selector) => {
  assertPageScope(scope, `Cannot call @${type} outside of page context`);
  const value = await resolveInternal("page", scope).$eval(
    selector,
    jsProcessing
  );
  if (value === null && !optional) {
    throw new BrowseError({
      message: `Element given to @${type} call had no content of the correct type. If this value is optional, try using @${type}?. This will set the value to null if a match isn't found`,
      node: null,
    });
  }
  const nearestPageScope = resolveInternalScope("page", scope);
  nearestPageScope.internal.data[key] = value;
  return value;
};

// undefined is not understood by browse. Best practice is to always return null
// rather than undefined to make function conversion to browse easier later
const getString = (el) => el.textContent || el.innerText || null;

const getNumber = (el) => {
  const text = el.textContent || el.innerText;
  const num = text ? Number(text) : null;
  return isNaN(num) ? null : num;
};

const getUrl = (el) => el.href || null;

/**
 * A scope accessible within a page RuleSet
 */
const getPageScope = (parent) => ({
  parent,
  vars: {},
  internal: {
    //To tell if you're in a page scope
    isPage: true,
    page: null,
    data: {},
    config: {},
  },
  rules: {
    help: (scope) => (_opts) => (key) => {
      // Find the lowest scope that actually has the 'help' rule
      const helpScope = resolveRuleScope("help", scope);
      help({
        resolveRule,
        scope: helpScope,
        key,
        functions: {
          config:
            "Takes in a ruleSet and overrides the set rule so that any sets within the ruleSet set config variables",
          click:
            "Takes in a selector and clicks the argument indicated by the selector",
          "@string":
            "<key> <selector>: Sets a key on the data object in nearest page scope to a string value specified by selector",
          "@string?":
            "<key> <selector>: Sets a key on the data object in nearest page scope to a string value specified by selector or null if there is no string value",
          "@number":
            "<key> <selector>: Sets a key on the data object in nearest page scope to a numeric value specified by selector",
          "@number?":
            "<key> <selector>: Sets a key on the data object in nearest page scope to a numeric value specified by selector or null if there is no numeric value",
          "@url":
            "<key> <selector>: Sets a key on the data object in nearest page scope to the href value at the selector",
          "@url?":
            "<key> <selector>: Sets a key on the data object in nearest page scope to the href value at the selector or to null if there is no href value",
          page:
            "Defines a page definition which matches on the regex passed in as the first argument, and which executes the rule set passed in as the second argument on every matching page",
          press: "Presses the given key",
          screenshot:
            "Takes a path to a file as an argument, and saves a screenshot of the current page to that file",
          type: "Types the given string one character at a time",
          wait:
            "If pased a number, waits for that many ms. If passed a selector, waits for that selector to be renderered",
        },
      });
      return null;
    },
    "@string": dataStorageRule(getString, "string"),
    "@string?": dataStorageRule(getString, "string", true),
    "@number": dataStorageRule(getNumber, "number"),
    "@number?": dataStorageRule(getNumber, "number", true),
    "@url": dataStorageRule(getUrl, "url"),
    "@url?": dataStorageRule(getUrl, "url", true),
    click: (scope) => (_opts) => async (selector) => {
      assertPageScope(scope, `Cannot call click outside of page context`);
      const page = resolveInternal("page", scope);
      if (!page) {
        return false;
      }
      await page.click(selector);
      return true;
    },
    config: (scope) => (_opts) => async (ruleSet) => {
      assertPageScope(scope, `Cannot call config outside of page context`);
      // Since config applies to pages, this should set the config for the nearest page
      const nearestPageScope = resolveInternalScope("page", scope);

      //Evaluate the ruleSet
      await evalRuleSet(ruleSet, {
        rules: {
          set: (_) => (_) => (name, value) => {
            // Note: a benefit of validate scope, there is no need to check
            // nearestPageScope, we know we're in a page scope
            nearestPageScope.internal.config[name] = value;
            if (name === "output") {
              // For output files, we create the file and any directories and then open up a write stream
              fs.ensureFileSync(value);
              nearestPageScope.internal.config.writeStream = fs.createWriteStream(
                value
              );
            }
          },
        },
      });

      return nearestPageScope.internal.config;
    },
    crawl: (scope) => (_opts) => async (selector) => {
      assertPageScope(scope, `Cannot call crawl outside of page context`);
      const page = resolveInternal("page", scope);
      const urls = await page.$$eval(selector, (elArr) =>
        elArr.map((el) => el.href).filter(Boolean)
      );

      const ruleNodes = urls.map((url) => ({
        type: "Rule",
        fn: {
          type: "InitRule",
          name: { type: "Word", name: "visit" },
          options: [],
        },
        args: [{ type: "Literal", value: url }],
      }));

      const values = await Promise.all(
        ruleNodes.map((ruleNode) => evalRule(ruleNode, scope))
      );
      return values;
    },
    press: (scope) => (_opts) => async (key) => {
      assertPageScope(scope, `Cannot call press outside of page context`);
      const page = resolveInternal("page", scope);
      if (!page) {
        return false;
      }
      await page.keyboard.press(key);
      return true;
    },
    screenshot: (scope) => (_opts) => async (fname) => {
      const page = resolveInternal("page", scope);
      if (!page) {
        return false;
      }
      await page.screenshot({ path: fname });
      return true;
    },
    type: (scope) => (_opts) => async (...values) => {
      assertPageScope(scope, `Cannot call type outside of page context`);
      validateScope((scope) => scope.internal.isPage, scope, true);
      const page = resolveInternal("page", scope);
      if (!page) {
        return false;
      }
      const keys = [...values.join(" ")];
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        await page.keyboard.press(key);
      }
      return values.join(" ");
    },
    wait: (scope) => (_opts) => async (value) => {
      assertPageScope(scope, `Cannot call wait outside of page context`);
      const page = resolveInternal("page", scope);
      if (!page) {
        return false;
      }
      if (typeof value === "number") {
        await page.waitFor(value);
      } else if (typeof value === "string") {
        await page.waitForSelector(value);
      } else {
        return false;
      }
      return true;
    },
  },
});

module.exports = getPageScope;
