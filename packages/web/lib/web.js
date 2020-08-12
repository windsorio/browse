"use strict";

const puppeteer = require("puppeteer");
const { getNewScope, evalRuleSet } = require("@browselang/core");
const {
  resolveInternal,
  resolveFn,
  resolveFnScope,
} = require("@browselang/core/lib/scope");
const { help } = require("@browselang/core/lib/utils");

const getPageScope = require("./page");

/**
 * A scope containing all the web-scraping functions and variables
 */
const getWebScope = (parent) => ({
  parent,
  vars: {},
  internal: {
    // A single browser for now
    browser: null,
    // Page definitions
    pageDefs: {},
    page: null,
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
          page:
            "Defines a page definition which matches on the regex passed in as the first argument, and which executes the rule set passed in as the second argument on every matching page",
          visit: "Open a new tab/page with the given url",
        },
      });
      return null;
    },
    page: (scope) => (hrefRegex, ...rulesets) => {
      if (rulesets.length > 1) {
        console.warn("Only one ruleset is currently supported");
      }

      // We now have a rule for this href Regex so we push it
      resolveInternal("pageDefs", scope)[hrefRegex] = rulesets[0];
      return null;
    },
    visit: (scope) => async (href) => {
      let browser;
      try {
        // TODO: def is defined so we don't have to error catch
        browser = resolveInternal("browser", scope);
      } catch (e) {}
      if (!browser) {
        browser = scope.internal.browser = await puppeteer.launch({
          headless: false,
        });
      }
      const pageDefs = resolveInternal("pageDefs", scope);

      // const escapeRegExp = string => string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
      // TODO: We need to figure out how we're going to do regex as part of a URL where a lot of the characters are meant to be literals.
      // Alredy tried 'escape' and the like. The issue is that, for instance, 'space' being converted to multiple characters actually significantly effects the regex matching. For now we will ignore most regex characters.
      // Exluding (*, +, ., (, and ) )
      // My solution would be to implement a limited regex specifically for browse to drastically reduce collisions between regex characters and url characters. The few remaining collisions could be escaped.
      //
      // Alternatively we could define a regex transformer where ' *' for instance would be replaced with (%20)* and then we could use escape with traditional regex
      const escapeRegExp = (string) =>
        string.replace(/[\-?^${}|[\]\\]/g, "\\$&");

      // TODO: Make this determinisitic, find a better way to do escaping
      // Scan the page definitions for all regex that match the href
      const scanPageDefs = (href) => {
        const regexps = Object.keys(pageDefs);
        return regexps
          .filter((r) => new RegExp(escapeRegExp(r), "g").test(href))
          .map((match) => ({
            name: match,
            ruleSet: pageDefs[match],
          }));
      };

      const page = scope.internal.page || (await browser.newPage());
      scope.internal.page = page;
      await page.goto(href);

      const matchingDefs = scanPageDefs(href);

      // TODO: support multple matching definitions
      // Really this should be a promise race or something similar
      // For now we just take the first RuleSet
      await Promise.all(
        matchingDefs.map(async (def, i) => {
          if (i === 0) {
            // Generate an empty scope (so that the user can shadow the page functions)
            //    that inherits from the page scope (with the page functions)
            //      that inherits from the current scope
            const pageScope = getNewScope(getPageScope(scope));
            return evalRuleSet(def.ruleSet, pageScope);
          }
          return;
        })
      );
      return href;
    },
  },
});

module.exports = getWebScope;
