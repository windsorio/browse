const puppeteer = require("puppeteer");
const { sleep } = require("./std");
const fns = require("./scrapeLib");

const pageDefs = {};

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const generateLambda = (ruleset) => {
    return async (page) => {
      const rtn = [];
      for (let i = 0; i < ruleset.length; i++) {
        const rule = ruleset[i];
        const name = rule[0];
        const args = rule.slice(1);
        if (name === "sleep") {
          rtn.push(sleep(...args));
        } else {
          console.log(`Executing ${name} with args ${args}`);
          rtn.push(await fns[name]({ page, browser, pageDefs }, ...args));
        }
      }
      return rtn;
    };
  };

  /* The Core Scraping Functions */

  //We follow the convention that all optional arguments for the function in browse are passed into an object as the first argument in node. (This allows infinite arity functions) all non-parenthesized arguments are then passed in as an array which is the second arguemnt.

  const pageDef = ({ optionalArgs: { render, cache, ttl }, requiredArgs }) => {
    const hrefRegex = requiredArgs[0];
    const rulesets = requiredArgs.slice(1);

    if (rulesets.length > 1) {
      console.log("We only support one ruleset for now");
      return;
    }

    //We now have a rule for this href Regex so we push it
    console.log("Rulesets", rulesets);
    pageDefs[hrefRegex] = generateLambda(rulesets[0]);
  };

  //I *think* this concept (rulesets) needs to be implemented at the js level because passing rulesets around isn't the same as passing lambdas around and the JS code might need to know that in some cases.
  pageDef({
    requiredArgs: [
      // The url
      "https://www.indiehackers.com/products?minRevenue=1&techSkills=code",
      [
        //The ruleset
        ["wait", ".collapsible-filters--active"],
        ["click", ".collapsible-filters--active"],
        ["click", ".collapsible-filters__option--selected"],
        ["sleep", 1000],
        ["wait", ".product-card__link"],
        [
          "_eval",
          `
          await new Promise((resolve, reject) => {
            const timer = setInterval(() => {
              const height = document.body.scrollHeight - 600;
              console.log(height);
              if (height >= 4500) {
                clearInterval(timer);
                resolve();
              }

              window.scrollBy(0, height);
            }, 200);
          });
        `,
          true,
        ],
        ["crawl", ".product-card__link"],
      ],
    ],
    optionalArgs: {},
  });

  pageDef({
    requiredArgs: [
      // The url
      "https://www.indiehackers.com/product/(.+)",
      [
        //The ruleset
        ["wait", ".user-header__username"],
      ],
    ],
    optionalArgs: {},
  });

  const res = await fns.visit(
    { page, browser, pageDefs },
    "https://www.indiehackers.com/products?minRevenue=1&techSkills=code"
  );

  console.log("Res", res);

  console.log(pageDefs);

  /* An Example Implemented WITHOUT rulesets */
  /*
  ;(async () => {
    await page.goto('https://www.indiehackers.com/products?minRevenue=1&techSkills=code');
    await wait (`.collapsible-filters--active`);
    await click (`.collapsible-filters--active`);
    await click (`.collapsible-filters__option--selected`);
    await sleep(1000);
    await wait (`.product-card__link`);

    console.log("evaluating");
    await _eval (`
      await new Promise((resolve, reject) => {
        const timer = setInterval(() => {
          const height = document.body.scrollHeight - 600;
          console.log(height);
          if (height >= 4500) {
            clearInterval(timer);
            resolve();
          }

          window.scrollBy(0, height);
        }, 200);
      });
    `, true);


    await crawl (`.product-card__link`);

    await sleep(100000)
    await browser.close();
  })();*/
})();
