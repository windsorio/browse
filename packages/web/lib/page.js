"use strict";

const {
  resolveInternal,
  resolveFn,
  resolveFnScope,
} = require("@browselang/core/lib/scope");
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
          info:
            "Prints out info about all of the functions if given no arguemnts. If given an argument, prints out info about the function whose name was passed",
          page:
            "Defines a page definition which matches on the regex passed in as the first argument, and which executes the rule set passed in as the second argument on every matching page",
          press: "Presses the given key",
          type: "Types the given string one character at a time",
          wait:
            "If pased a number, waits for that many ms. If passed a selector, waits for that selector to be renderered",
        },
      });
      return null;
    },
    click: (scope) => async (selector, wait = false) => {
      const page = resolveInternal("page", scope);
      if (!page) {
        return false;
      }
      console.log("Executing Click");
      console.log("Wait:", wait);
      if (wait) {
        console.log("Waiting ...");
        await page.waitFor(selector);
        console.log("Waited");
      }
      await page.click(selector);
      return true;
    },
    press: (scope) => async (key) => {
      const page = resolveInternal("page", scope);
      if (!page) {
        return false;
      }
      await page.keyboard.press(key);
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
