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
const isDocker = require("is-docker");

const getPageScope = require("./page");

const newBrowser = async () => {
  return await puppeteer.launch({
  headless: true,
  ...(isDocker()
    ? {
        args: [
          // Required for Docker version of Puppeteer
          "--no-sandbox",
          "--disable-setuid-sandbox",
          // This will write shared memory files into /tmp instead of /dev/shm,
          // because Docker’s default for /dev/shm is 64MB
          "--disable-dev-shm-usage",
        ],
      }
    : {}),
  });
}

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
        parent: scope,
      };
      return null;
    },
    //On visit, the current scope doesn't matter, only the scope of the rule that was matched
    visit: (scope) => async (href) => {
      // Check if any pageDefs exist and execute them if found
      let match = null;
      try {
        resolveInternal("pageDefs", scope, (defs) => {
          if (match || !defs) return false; // match already found

          // TODO: Make this determinisitic
          for (const key in defs) {
            const { matcher, ruleSet, parent } = defs[key];
            const matchObj = matcher.match(href.split("?")[0]);
            if (matchObj) {
              const urlObj = url.parse(href);
              match = {
                parent,
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
        const nearestBrowserScope = resolveInternalScope(
          "browser",
          match.parent
        );
        const nearestPageScope = resolveInternalScope("page", match.parent);

	let browser = nearestBrowserScope.internal.browser;;

        if (!browser) {
          browser = nearestBrowserScope.internal.browser = await newBrowser();
        }

        const page =
          nearestPageScope.internal.page || (await browser.newPage());

        nearestPageScope.internal.page = page;
        try {
          await page.goto(href);
        } catch (e) {
          throw new BrowseError({
            message: `Failed to goto url ${href}:: ${e.message}`,
            node: null,
          });
        }

        // Generate a new page scope with the same page
        const pageScope = getPageScope(match.parent);
        // inject args and "url" as variables
        Object.assign(pageScope.vars, match.path, {
          url: href,
          hash: match.hash,
          query: match.query,
        });

        // Navigate to the page
        pageScope.internal.page = await browser.newPage();

        try {
          await pageScope.internal.page.goto(href);
        } catch (e) {
          throw new BrowseError({
            message: `Failed to goto url ${href}`,
            node: null,
          });
        }

        // TODO: support multple matching definitions
        await evalRuleSet(match.ruleSet, pageScope);

        // TODO: check if the url has changed? If so, recurse and execute the necessary `page` rule
        const data = pageScope.internal.data;
        if (Object.keys(data).length) {
          if (data.url) {
            console.warn(
              "WARNING:: Setting the url key using a data function will override the default url key (See docs <https://....>)"
            );
          }
          data.url = href;
          console.log(JSON.stringify(data));
        }
        // TODO: check if the url has changed? If so, recurse and execute and necessary `pageDef` functions

        // Finally, close the page
        pageScope.internal.page.close();
      } else {
        //If there were no matches, we just go to the href from the current scope. (NOTE: I still don't like this solution because it special cases 'no matches'. This can be an issue, for instance, when crawling to a bunch of urls that don't match a page call. Instead
        const nearestBrowserScope = resolveInternalScope("browser", scope);
        const nearestPageScope = resolveInternalScope("page", scope);

        let browser = nearestBrowserScope.internal.browser;
        if (!browser) {
          browser = nearestBrowserScope.internal.browser = await puppeteer.launch(
            {
              headless: false,
            }
          );
        }

        const page =
          nearestPageScope.internal.page || (await browser.newPage());

        nearestPageScope.internal.page = page;
        try {
          await page.goto(href);
        } catch (e) {
          throw new BrowseError({
            message: `Failed to goto url ${href}`,
            node: null,
          });
        }
      }

      return href;
    },
  },
});

module.exports = getBrowserScope;
