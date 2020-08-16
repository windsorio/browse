"use strict";

const {
  resolveInternal,
  resolveFn,
  resolveFnScope,
  resolveInternalScope,
  validateScope,
} = require("@browselang/core/lib/scope");
const { evalRule, evalRuleSet, getNewScope } = require("@browselang/core");
const { help } = require("@browselang/core/lib/utils");
const fs = require("fs-extra");
const { keys } = require("./constants");

const dataStorageFn = (jsProcessing, type, optional = false) => (
  scope
) => async (key, selector) => {
  validateScope((scope) => scope.internal.isPage, scope, true);
  const value = await resolveInternal("page", scope).$eval(
    selector,
    jsProcessing
  );
  if (value === null && !optional) {
    throw new BrowseError({
      message: `Element given to @${type} call had no content of the correct type. If this is allowable, try using @${type}?`,
      node: null,
    });
  }
  const nearestPageScope = resolveInternalScope("page", scope);
  nearestPageScope.internal.data[key] = value;
  return value;
};

//Undefined is not understood by browse. Best practice is to always return null rather than undefined to make function conversion to browse easier later
const getString = (el) => el.textContent || el.innerText || null;

const getNumber = (el) => {
  if (el.textContent || el.innerText) {
    let num = null;
    if (el.textContent) {
      num = Number(el.textContent);
    }
    if (!num && el.innerText) {
      num = Number(el.innerText);
    }
    if (isNaN(num)) return null;
    return num;
  } else {
    return null;
  }
};

const getUrl = (el) => el.href || null;

/**
 * A scope accessible within a page RuleSet
 */
const getPageScope = (parent) => ({
  parent,
  vars: {
    //The key in the keys map corresponds to the value we should pass in to the press function.
    ...Object.assign({}, ...Object.keys(keys).map((key) => ({ [key]: key }))),
  },
  internal: {
    //To tell if you're in a page scope
    isPage: true,
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
          config:
            "Takes in a ruleSet and overrides the set function so that any sets within the ruleSet set config variables",
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
          info:
            "Prints out info about all of the functions if given no arguemnts. If given an argument, prints out info about the function whose name was passed",
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
    "@string": dataStorageFn(getString, "string"),
    "@string?": dataStorageFn(getString, "string", true),
    "@number": dataStorageFn(getNumber, "number"),
    "@number?": dataStorageFn(getNumber, "number", true),
    "@url": dataStorageFn(getUrl, "url"),
    "@url": dataStorageFn(getUrl, "url", true),
    click: (scope) => async (selector) => {
      validateScope((scope) => scope.internal.isPage, scope, true);
      const page = resolveInternal("page", scope);
      if (!page) {
        return false;
      }
      await page.click(selector);
      return true;
    },
    config: (scope) => async (ruleSet) => {
      validateScope((scope) => scope.internal.isPage, scope, true);
      //Since config applies to pages, this should set the config for the nearest page
      const nearestPageScope = resolveInternalScope("page", scope);

      const configScope = getNewScope(nearestPageScope);

      //Override the set behavior
      configScope.fns.set = (scope) => (name, value) => {
        //Note: a benefit of validate scope, there is no need to check nearestPageScope, we know we're in a page scope
        nearestPageScope.internal.config[name] = value;
        if (name === "output") {
          //For output files, we create the file and any directories and then open up a write stream
          fs.ensureFileSync(value);
          nearestPageScope.internal.config.writeStream = fs.createWriteStream(
            value
          );
        }
      };
      //Evaluate the ruleSet
      await evalRuleSet(ruleSet, configScope);

      return nearestPageScope.internal.config;
    },
    crawl: (scope) => async (selector) => {
      validateScope((scope) => scope.internal.isPage, scope, true);
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
      validateScope((scope) => scope.internal.isPage, scope, true);
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
    wait: (scope) => async (value) => {
      validateScope((scope) => scope.internal.isPage, scope, true);
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
