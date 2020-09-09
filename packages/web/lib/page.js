"use strict";

const fs = require("fs-extra");
const {
  resolveRule,
  resolveRuleScope,
  resolveVar,
} = require("@browselang/core/lib/scope");
const { evalRule, evalRuleSet, getNewScope } = require("@browselang/core");
const { help, throws } = require("@browselang/core/lib/utils");
const scope = require("@browselang/core/lib/scope");

/**
 * Data extraction rules
 * Explicitly return `null` if no data is available
 */
const getString = (el) => el.textContent || el.innerText || null;
const getStrings = (els) =>
  els.map((el) => el.textContent || el.innerText || null).filter(Boolean);
const getNumber = (el) => {
  let num = el.textContent ? Number(el.textContent) : NaN;
  if (isNan(num)) num = el.innerText ? Number(el.innerText) : NaN;
  return isNaN(num) ? null : num; // TODO: add NaN to browse?
};
const getUrl = (el) => el.href || null;

const getPageScope = (parent) => {
  /**
   * @scope { A scope accessible within a `page` RuleSet }
   */
  const pageScope = {
    parent,
    vars: {},
    internal: {
      page: null,
      /**
       * @config {
       *   [output: string] The file to output to
       *   [writeStream: WriteStream] A stream whose output is the file named by output
       * }
       */
      config: {
        output: null,
        writeStream: null,
      },
      data: {},
      // If other pages are visited from this page, we track those here
      links: [],
    },
    rules: {},
  };

  const dataExtractionRule = (extractor, type, optional = false) => (
    scope
  ) => ({ trim = true }) => async (key, selector) => {
    let value = null;
    try {
      value = await pageScope.internal.page.$eval(selector, extractor);
      if (value === null || value === undefined) {
        value = null; // We don't want undefined in the `finally` clause
        throw new Error(
          `Element given to @${type} call had no content of the correct type`
        );
      }
      if (trim && typeof value === "string") {
        value = value.trim();
      }
    } catch (e) {
      throw e;
    } finally {
      // Always explicitly set it to null
      pageScope.vars[key] = value;
    }
    return value;
  };

  pageScope.rules = {
    help: (scope) => (_) => (key) => {
      // Find the lowest scope that actually has the 'help' rule
      const helpScope = resolveRuleScope("help", scope);
      help({
        resolveRule,
        scope: helpScope,
        key,
        functions: {
          pageConfig:
            "Takes in a ruleSet and overrides the set rule so that any sets within the ruleSet set config variables",
          click:
            "Takes in a selector and clicks the argument indicated by the selector",
          "@string":
            "<key> <selector>: Sets a key on the data object in nearest page scope to a string value specified by selector",
          "@number":
            "<key> <selector>: Sets a key on the data object in nearest page scope to a numeric value specified by selector",
          "@url":
            "<key> <selector>: Sets a key on the data object in nearest page scope to the href value at the selector",
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
    pageConfig: (_) => (_) => async (ruleSet) => {
      // Evaluate the ruleSet
      await evalRuleSet(ruleSet, {
        rules: {
          set: (_) => (_) => (name, value) => {
            pageScope.internal.config[name] = value;
            if (name === "output") {
              // For output files, we create the file and any directories and then open up a write stream
              fs.ensureFileSync(value);
              pageScope.internal.config.writeStream = fs.createWriteStream(
                value
              );
            }
          },
        },
      });
      return new Map(Object.entries(pageScope.internal.config));
    },
    "@string": dataExtractionRule(getString, "string"),
    "@number": dataExtractionRule(getNumber, "number"),
    "@url": dataExtractionRule(getUrl, "url"),
    "@arr": (_) => ({ string = false, trim = true }) => async (
      key,
      selector
    ) => {
      let type, extractor;
      if (string) {
        type = "string";
        extractor = getStrings;
      }
      // TODO: support more type

      if (!type)
        throw new Error(
          "A type option must be set when using @arr. Example: @arr(string) or @arr(number)"
        );

      let value = await pageScope.internal.page.$$eval(selector, getStrings);
      if (trim && type === "string") {
        value = value.map((s) => s.trim());
      }
      pageScope.vars[key] = value;
      return value;
    },
    out: (scope) => (_) => (...vars) => {
      const safeResolveVar = throws(resolveVar);
      vars.forEach((name) => {
        pageScope.internal.data[name] =
          safeResolveVar(name, scope).value || null;
      });
      return null;
    },
    click: (_) => (_) => async (selector) => {
      const page = pageScope.internal.page;
      if (!page) {
        return false;
      }
      await page.click(selector);
      return true;
    },
    crawl: (scope) => (_) => async (selector) => {
      const page = pageScope.internal.page;
      const urls = await page.$$eval(selector, (elArr) =>
        elArr.map((el) => el.href).filter(Boolean)
      );

      pageScope.internal.links.push(...urls);

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
        // It's as if this crawl was replaced with multiple visit calls, so we
        // can use this current scope to evaluate them
        ruleNodes.map((ruleNode) => evalRule(ruleNode, scope))
      );
      return values;
    },
    press: (_) => (_) => async (key) => {
      const page = pageScope.internal.page;
      if (!page) {
        return false;
      }
      await page.keyboard.press(key);
      return true;
    },
    screenshot: (_) => (_) => async (fname) => {
      const page = pageScope.internal.page;
      if (!page) {
        return false;
      }
      await page.screenshot({ path: fname });
      return true;
    },
    type: (_) => (_) => async (...values) => {
      const page = pageScope.internal.page;
      if (!page) {
        return false;
      }
      const str = values.join(" ");
      const keys = [...str];
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        await page.keyboard.press(key);
      }
      return str;
    },
    wait: (_) => (_) => async (value) => {
      const page = pageScope.internal.page;
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
  };

  pageScope.close = async () => {
    if (pageScope.internal.page) {
      await pageScope.internal.page.close();
    }
    if (pageScope.internal.config.writeStream) {
      pageScope.internal.config.writeStream.end();
    }
  };

  return pageScope;
};

module.exports = getPageScope;
