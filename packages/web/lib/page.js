"use strict";

const {
  resolveInternal,
  resolveFn,
  resolveFnScope,
  resolveInternalScope,
} = require("@browselang/core/lib/scope");
const { evalRule, evalRuleSet } = require("@browselang/core");
const { help } = require("@browselang/core/lib/utils");

/**
 * A scope accessible within a page RuleSet
 */
const getPageScope = (parent) => ({
  parent,
  vars: {},
  internal: {
    page: null,
    data: {},
    config: {},
  },
  fns: {
    help: (scope) => (key) => {
      // Find the lowest scope that actually has the 'help' function
      const helpScope = resolveFnScope("help", scope);
      help({
        resolveFn,
        scope: helpScope,
        key,
        functions: {
          click:
            "Takes in a selector and clicks the argument indicated by the selector",
          screenshot:
            "Takes a path to a file as an argument, and saves a screenshot of the current page to that file",
          press: "Presses the given key",
          type: "Types the given string one character at a time",
          wait:
            "If pased a number, waits for that many ms. If passed a selector, waits for that selector to be renderered",
        },
      });
      return null;
    },
    "@string": (scope) => async (key, selector) => {
      const value = await resolveInternal("page", scope).$eval(
        selector,
        (el) => el.textContent
      );
      if (value === null) {
        throw new BrowseError({
          message: `Element given to @string call had no text content (Did you mean to use @string?)`,
          node: null,
        });
      }
      const nearestPageScope = resolveInternalScope("page", scope);
      nearestPageScope.internal.data[key] = value;
      return value;
    },
    "@string?": (scope) => async (key, selector) => {
      const value = await resolveInternal("page", scope).$eval(
        selector,
        (el) => el.textContent
      );
      if (value === null) {
        console.warn(
          `WARNING:: No value found for @string call with key ${key}, the value will be set to null`
        );
      }
      const nearestPageScope = resolveInternalScope("page", scope);
      nearestPageScope.internal.data[key] = value;
      return value;
    },
    "@number": (scope) => async (key, selector) => {
      const value = await resolveInternal("page", scope).$eval(
        selector,
        (el) => {
          if (el.textContent || el.innerText) {
            let num = null;
            if (el.textContent) {
              num = Number(el.textContent);
            }
            if (!num && el.innerText) {
              num = Number(el.innerText);
            }
            return num;
          } else {
            return null;
          }
        }
      );

      if (value === null) {
        console.warn(
          `WARNING:: No value found for @number call with key ${key}, the value will be set to null`
        );
      }
      if (isNaN(value)) {
        //TODO: Use browse error?
        console.error(
          "ERROR:: Called @number on an element whose text couldn't be parsed as a number"
        );
        return false;
      }
      const nearestPageScope = resolveInternalScope("page", scope);
      nearestPageScope.internal.data[key] = value;
      return value;
    },
    "@url": (scope) => async (key, selector) => {
      const value = await resolveInternal("page", scope).$eval(
        selector,
        (el) => el.href
      );
      if (value === null) {
        console.warn(
          `WARNING:: No value found for @url call with key ${key}, the value will be set to null`
        );
      }
      const nearestPageScope = resolveInternalScope("page", scope);
      nearestPageScope.internal.data[key] = value;
      return value;
    },
    click: (scope) => async (selector) => {
      const page = resolveInternal("page", scope);
      if (!page) {
        return false;
      }
      await page.click(selector);
      return true;
    },
    config: (scope) => async (ruleset) => {
      console.log("Setting Config");
      //Override the set behavior
      const oldSet = scope.fns.set;
      scope.fns.set = (scope) => (name, value) => {
        const nearestPageScope = resolveInternalScope("page", scope);
        if (nearestPageScope) {
          nearestPageScope.internal.config[name] = value;
        } else {
          throw new BrowseError({
            message: `config was called outside a page scope`,
            node: null,
          });
        }
      };
      //Evaluate the ruleset
      await evalRuleSet(ruleset, scope);
      if (oldSet !== undefined) {
        scope.fns.set = oldSet;
      } else {
        delete scope.fns.set;
      }
      const nearestPageScope = resolveInternalScope("page", scope);
      return nearestPageScope.internal.config;
    },
    crawl: (scope) => async (selector) => {
      const page = resolveInternal("page", scope);
      const urls = await page.$$eval(selector, (elArr) =>
        elArr.map((el) => el.href).filter(Boolean)
      );

      const ruleNodes = urls.map((url) => ({
        type: "Rule",
        fn: { type: "Word", name: "visit" },
        args: [{ type: "Literal", value: url }],
      }));

      const values = await Promise.all(
        ruleNodes.map((ruleNode) => evalRule(ruleNode, scope))
      );
      return values;
    },
    press: (scope) => async (key) => {
      const page = resolveInternal("page", scope);
      if (!page) {
        return false;
      }
      await page.keyboard.press(key);
      return true;
    },
    screenshot: (scope) => async (fname) => {
      const page = resolveInternal("page", scope);
      if (!page) {
        return false;
      }
      await page.screenshot({ path: fname });
      return true;
    },
    type: (scope) => async (...values) => {
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
    wait: (scope) => async (value) => {
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
