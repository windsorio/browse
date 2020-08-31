"use strict";
const url = require("url");
// TODO: To minimize dependencies we should just write this
const fs = require("fs-extra");
const puppeteer = require("puppeteer");
const UrlPattern = require("url-pattern");
const isDocker = require("is-docker");
const removeTrailingSlash = require("remove-trailing-slash");
const { evalRuleSet } = require("@browselang/core");
const {
  resolveRule,
  resolveRuleScope,
  resolveVar,
  resolveInternal,
  resolveInternalScope,
  validateScope,
} = require("@browselang/core/lib/scope");
const { help, stringify, throws } = require("@browselang/core/lib/utils");
const { BrowseError } = require("@browselang/core/lib/error");

const getPageScope = require("./page");

const newBrowser = async (headless) => {
  return puppeteer.launch({
    ...(isDocker()
      ? {
          headless,
          args: [
            // Required for Docker version of Puppeteer
            "--no-sandbox",
            "--disable-setuid-sandbox",
            // This will write shared memory files into /tmp instead of
            // /dev/shm, because Docker’s default for /dev/shm is 64MB
            "--disable-dev-shm-usage",
          ],
        }
      : {
          headless,
        }),
  });
};

const assertBrowserScope = (scope, message) => {
  if (!validateScope((scope) => scope.internal.isBrowser, scope)) {
    throw new Error(message);
  }
};

//Centralize control of goto function
const go = async (page, url) => {
  return page.goto(url, {
    timeout: 25000,
  });
};

const preparePage = async (browser, href) => {
  const page = await browser.newPage();

  try {
    await go(page, href);
  } catch (e) {
    throw new BrowseError({
      message: `Failed to goto url ${href}`,
      node: null,
    });
  }

  return page;
};

/**
 * @scope { A scope containing all the web-scraping rules and variables }
 * @name { Browser }
 */
const getBrowserScope = (parent) => {
  const browserScope = {
    parent,
    vars: {
      headless: true,
    },
    internal: {
      browser: null,
      // Page definitions
      pageDefs: {},
    },
  };

  browserScope.rules = {
    help: (scope) => (_) => (key) => {
      // Find the lowest scope that actually has the 'help' rule
      const helpScope = resolveRuleScope("help", scope);
      help({
        resolveRule,
        scope: helpScope,
        key,
        functions: {
          page:
            "Instantiates a page definition which matches on the url-pattern passed in as the first argument, and which executes the rule set passed in as the second argument on every matching page",
          visit:
            "Open a new tab/page with the given url and checks for matches on that URL. If there are matches the corresponding ruleSets will be run. If there is no match The new tab/page is opened in the browser scope and no actions will be taken",
        },
      });
      return null;
    },
    // Override print to stderr, so that stdout output is reserved for the
    // data extraction and can be piped easily
    print: (_) => (_) => (...args) => {
      console.error(args.map(stringify).join(" "));
      return args.slice(-1)[0];
    },
    /**
     * @rule { Page }
     * @scope { Browser }
     * @desc { Instantiates a page definition which matches on the url-pattern passed in as the first argument, and which executes the rule set passed in as the second argument on every matching page }
     */
    page: (_) => ({ scrape = true }) => (pattern, ...ruleSets) => {
      const urlObj = url.parse(pattern);

      if (!urlObj || !urlObj.host) {
        throw new Error(`'${pattern}' is not a valid URL pattern`);
      }

      // validate that the path does not contain :{url,query,hash}
      if (urlObj.pathname && /:(url|query|hash)/.test(urlObj.pathname)) {
        throw new Error(
          `The pattern cannot contain :url, :query or :hash. $url, $query and $hash are automatically set by page`
        );
      }

      let finalPattern = "http(s)\\://";
      finalPattern += urlObj.host;
      if (urlObj.port) {
        finalPattern += "\\:" + urlObj.port;
      }
      if (urlObj.pathname) {
        finalPattern += urlObj.pathname; // this can contain ":" which goes back into a new urlpattern
      }

      // Make trailing slash optional
      finalPattern = removeTrailingSlash(finalPattern);
      finalPattern += "(/)";

      browserScope.internal.pageDefs[finalPattern] = {
        matcher: new UrlPattern(finalPattern),
        ruleSets,
        scrape,
      };
      return null;
    },
    /**
     * @rule { Visit }
     * @scope { Browser }
     * @desc { Open a new tab/page with the given url and checks for matches on that URL. If there are matches the corresponding ruleSets will be run. If there is no match The new tab/page is opened in the browser scope and no actions will be taken }
     */
    visit: (scope) => (_opts) => async (href) => {
      // Check if any pageDefs exist
      let match = null;
      try {
        resolveInternal("pageDefs", browserScope, (defs) => {
          if (match || !defs) return false; // match already found

          // TODO: Make this determinisitic
          for (const key in defs) {
            const { matcher, ruleSets, scrape } = defs[key];
            const matchObj = matcher.match(href.split("?")[0]);
            if (matchObj) {
              const urlObj = url.parse(href);
              match = {
                ruleSets,
                scrape,
                path: matchObj,
                query: urlObj.query || null,
                hash: urlObj.hash || null,
              };
            }
          }
          return !!match;
        });
      } catch (e) {}

      const isHeadless = resolveVar("headless", scope);

      // Setup a browser if there isn't one
      let browser = browserScope.internal.browser;
      if (!browser) {
        browser = browserScope.internal.browser = await newBrowser(isHeadless);
      }

      if (match) {
        await Promise.all(
          match.ruleSets.map(async (ruleSet) => {
            const newPageScope = getPageScope(ruleSet.scope);

            const page = await preparePage(browser, href);
            newPageScope.internal.page = page;

            // inject args and "url" as variables into the new page scope
            Object.assign(newPageScope.vars, match.path, {
              url: href,
              hash: match.hash,
              query: match.query,
            });

            // TODO: add checks to the ruleSet to identify if the url has
            // changed. If so, and there are more rules to execute, throw error.
            // If it's the last rule, then call `visit` on the new url so
            // pageDefs are resolved once more
            await evalRuleSet(ruleSet, newPageScope);

            if (match.scrape) {
              const data = newPageScope.internal.data;
              if (Object.keys(data).length) {
                if (data.url !== undefined) {
                  console.error(
                    "Warning: 'url' cannot be passed to the 'out' rule. This key is reserved and it will be overridden by browse (See docs <https://....>)"
                  );
                }
                data.url = href;
                if (data._links !== undefined) {
                  console.error(
                    "Warning: '_links' cannot be passed to the 'out' rule. This key is reserved and it will be overridden by browse (See docs <https://....>)"
                  );
                }
                data._links = newPageScope.internal.links;

                // Redundant since they're in the url, if the consumer wants them
                delete data.hash;
                delete data.query;

                const { value: config, success } = throws(resolveInternal)(
                  "config",
                  newPageScope,
                  (config) => !!config.output
                );

                if (success && config.output) {
                  // TODO: A better file output setup
                  if (!config.writeStream) {
                    fs.ensureFileSync(config.output);
                    config.writeStream = fs.createWriteStream(config.output);
                  }
                  config.writeStream.write(JSON.stringify(data) + "\n", {
                    flags: "a",
                  });
                  config.writeStream.end("");
                  delete config.writeStream;
                } else {
                  // This should be the only thing that's logged to stdout
                  console.log(JSON.stringify(data));
                }
              }
            }

            // Finally, close the page
            await newPageScope.close();
          })
        );
      } else {
        // Get the nearest page scope
        const nearestPageScope = resolveInternalScope("page", scope);
        nearestPageScope.page = await preparePage(browser, href);
      }
      return href;
    },
  };

  browserScope.close = async () => {
    if (browserScope.internal.browser) {
      await browserScope.internal.browser.close();
    }
  };

  return browserScope;
};

module.exports = getBrowserScope;
