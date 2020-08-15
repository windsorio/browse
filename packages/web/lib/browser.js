"use strict";

const url = require("url");
const puppeteer = require("puppeteer");
const { evalRuleSet } = require("@browselang/core");
const {
  resolveInternal,
  resolveFn,
  resolveFnScope,
  resolveInternalScope,
} = require("@browselang/core/lib/scope");
const { help } = require("@browselang/core/lib/utils");
const UrlPattern = require("url-pattern");
const { BrowseError } = require("@browselang/core/lib/error");

const getPageScope = require("./page");

/**
 * A scope containing all the web-scraping functions and variables
 */
const getBrowserScope = (parent) => ({
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
    page: (scope) => (pattern, ...rulesets) => {
      if (rulesets.length > 1) {
        console.warn("Only one ruleset is currently supported");
      }

      const urlObj = url.parse(pattern);

      if (!urlObj || !urlObj.host) {
        throw new BrowseError({
          message: `'${pattern}' is not a valid URL pattern`,
          node: null,
        });
      }

      // validate that the path does not contain :url
      if (urlObj.pathname && /:(url|query|hash)/.test(urlObj.pathname)) {
        throw new BrowseError({
          message: `The pattern cannot contain :url, :query or :hash. $url, $query and $hash are automatically set when evaluating the page RuleSet`,
          node: null,
        });
      }

      let finalPattern = "http(s)\\://";
      finalPattern += urlObj.host;
      if (urlObj.port) {
        finalPattern += "\\:" + urlObj.port;
      }
      if (urlObj.pathname) {
        finalPattern += urlObj.pathname; // this can contain ":" which goes back into a new urlpattern
      }

      resolveInternal("pageDefs", scope)[finalPattern] = {
        matcher: new UrlPattern(finalPattern),
        ruleSet: rulesets[0],
      };
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

          // TODO: Make this determinisitic
          for (const key in defs) {
            const { matcher, ruleSet } = defs[key];
            const matchObj = matcher.match(href.split("?")[0]);
            if (matchObj) {
              const urlObj = url.parse(href);
              match = {
                ruleSet,
                path: matchObj,
                query: urlObj.query || null,
                hash: urlObj.hash || null,
              };
            }
          }
          return !!match;
        });
      } catch (e) {}

      if (match) {
        // Generate a new page scope with the same page
        const pageScope = getPageScope(scope);
        // inject args and "url" as variables
        Object.assign(pageScope.vars, match.path, {
          url: href,
          hash: match.hash,
          query: match.query,
        });

        // Navigate to the page
        pageScope.internal.page = await browser.newPage();
        await pageScope.internal.page.goto(href);

        // TODO: support multple matching definitions
        await evalRuleSet(match.ruleSet, pageScope);

        // TODO: check if the url has changed? If so, recurse and execute the necessary `page` rule

        // Finally, close the page
        pageScope.internal.page.close();
      }

      return href;
    },
  },
});

module.exports = getBrowserScope;
