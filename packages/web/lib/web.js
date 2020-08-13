"use strict";

const puppeteer = require("puppeteer");
const { evalRuleSet } = require("@browselang/core");
const {
  resolveInternal,
  resolveFn,
  resolveFnScope,
  resolveInternalScope,
} = require("@browselang/core/lib/scope");
const { help } = require("@browselang/core/lib/utils");

const getPageScope = require("./page");

// TODO: We need to figure out how we're going to do regex as part of a URL where a lot of the characters are meant to be literals.
// Alredy tried 'escape' and the like. The issue is that, for instance, 'space' being converted to multiple characters actually significantly effects the regex matching. For now we will ignore most regex characters.
// Exluding (*, +, ., (, and ) )
// My solution would be to implement a limited regex specifically for browse to drastically reduce collisions between regex characters and url characters. The few remaining collisions could be escaped.
// Alternatively we could define a regex transformer where ' *' for instance would be replaced with (%20)* and then we could use escape with traditional regex
const genRegex = (string) =>
  new RegExp(string.replace(/[\-?^${}|[\]\\]/g, "\\$&"), "g");

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
      const nearestWebScope = resolveInternalScope("browser", scope);
      const nearestPageScope = resolveInternalScope("page", scope);

      let browser = nearestWebScope.internal.browser;
      if (!browser) {
        browser = nearestWebScope.internal.browser = await puppeteer.launch({
          headless: false,
        });
      }

      const page = nearestPageScope.internal.page || (await browser.newPage());
      nearestPageScope.internal.page = page;
      await page.goto(href);

      // Check if any pageDefs exist and execute them if found
      let match = null;
      try {
        resolveInternal("pageDefs", scope, (defs) => {
          if (match || !defs) return false; // match already found

          // TODO: Make this determinisitic, find a better way to do escaping
          // Scan the page definitions for all regex that match the href
          match = Object.keys(defs).find((r) => genRegex(r).test(href)) || null;
          if (match) {
            match = {
              name: match,
              ruleSet: defs[match],
            };
          }
          return !!match;
        });
      } catch (e) {}

      console.log("Visit Matches", match);

      if (match) {
        // Generate a new page scope with the same page
        const pageScope = getPageScope(scope);
        pageScope.internal.page = await browser.newPage();
        await pageScope.internal.page.goto(href);

        // TODO: support multple matching definitions
        // Really this should be a promise race or something similar
        // For now we just use the first RuleSet
        console.log("Evaluating", match.ruleSet);
        await evalRuleSet(match.ruleSet, pageScope);

        // TODO: check if the url has changed? If so, recurse and execute and necessary `pageDef` functions

        // Finally, close the page
        pageScope.internal.page.close();
      }

      return href;
    },
  },
});

module.exports = getWebScope;
