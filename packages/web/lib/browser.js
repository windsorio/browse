"use strict";
//TODO: To minimize dependencies I should just write this
const fs = require("fs-extra");

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
const go = async (page, href) => {
  return page.goto(href, {
    timeout: 25000,
    //    waitUntil: "networkidle2",
  });
};

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
    visit: (scope) => async (href) => {
      // Check if any pageDefs exist and execute them if found
      let match = null;
      try {
        resolveInternal("pageDefs", scope, (defs) => {
          if (match || !defs) return false; // match already found

          // TODO: Make this determinisitic
          for (const key in defs) {
            const { matcher, ruleSet, parent } = defs[key];
            console.log(matcher, href);
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
        console.log("Match");
        /*
         * Get the nearest lexical browers scope
         */
        const nearestBrowserScope = resolveInternalScope(
          "browser",
          match.parent
        );

        //If there is no browser create one
        let browser = nearestBrowserScope.internal.browser;
        if (!browser) {
          browser = nearestBrowserScope.internal.browser = await newBrowser();
        }

        //Create a new page scope in the same scope that the page rule was created in
        const newPageScope = getPageScope(match.parent);

        //Give the new page scope a fresh tab
        const page = await browser.newPage();
        newPageScope.internal.page = page;

        // inject args and "url" as variables into the new page scope
        Object.assign(newPageScope.vars, match.path, {
          url: href,
          hash: match.hash,
          query: match.query,
        });

        //Navigate to the url
        try {
          await go(page, href);
        } catch (e) {
          throw new BrowseError({
            message: `Failed to goto url ${href}:: ${e.message}`,
            node: null,
          });
        }

        // TODO: support multple matching definitions
        await evalRuleSet(match.ruleSet, newPageScope);

        // TODO: check if the url has changed? If so, recurse and execute the necessary `page` rule
        const data = newPageScope.internal.data;
        if (Object.keys(data).length) {
          if (data.url) {
            console.warn(
              "WARNING:: Setting the url key using a data function will override the default url key (See docs <https://....>)"
            );
          }
          data.url = href;
          try {
            //TODO, resolve should return a boolean so we don't have to try catch. users of resolve should throw the errors
            const config = resolveInternal(
              "config",
              newPageScope,
              (config) => !!config.output
            );
            config.writeStream.write(JSON.stringify(data) + "\n", {
              flags: "a",
            });
            config.writeStream.end("");
          } catch (e) {
            console.log(JSON.stringify(data));
          }
        }
        // TODO: check if the url has changed? If so, recurse and execute and necessary `pageDef` functions
        // Finally, close the page
        newPageScope.internal.page.close();
      } else {
        console.log("No match");
        //Get the nearest browser scope from the callstack (not lexically)
        //NOTE: We might want to change this when we have multiple browser scopes
        const nearestBrowserScope = resolveInternalScope("browser", scope);

        //If the nearest browser scope doesn't exist, then create a browser at the top level
        //NOTE: This is pretty dependent on the current scope structure
        let browser = nearestBrowserScope.internal.browser;
        if (!browser) {
          browser = nearestBrowserScope.internal.browser = await puppeteer.launch(
            {
              headless: false,
            }
          );
        }

        //Create a new page scope from the nearest browser scope (based on call stack)
        //NOTE:: Might want to change this later
        const newPageScope = getPageScope(nearestBrowserScope);

        //Give the new page scope a fresh tab
        const page = await browser.newPage();
        newPageScope.internal.page = page;

        //Navigate to the fresh page
        try {
          await go(page, href);
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
