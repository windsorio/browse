//TODO: Blocked on bad example code (90% sure), talk to Pranay
const puppeteer = require("puppeteer");
const fns = require("./scrapeLib");
const pageDefs = {};

//I *think* this concept (rulesets) needs to be implemented at the js level because passing rulesets around isn't the same as passing lambdas around and the JS code might need to know that in some cases.
fns._page(
  { pageDefs, fns },
  {
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
  }
);

fns._page(
  { pageDefs, fns },
  {
    requiredArgs: [
      // The url
      "https://www.indiehackers.com/product/(.+)",
      [
        //The ruleset
        ["wait", ".user-header__username"],
        ["_string", "title", ".product-header__title"],
      ],
    ],
    optionalArgs: {},
  }
);

(async () => {
  const browser = await puppeteer.launch({ headless: false });

  const res = await fns.visit(
    { browser, pageDefs },
    "https://www.indiehackers.com/products?minRevenue=1&techSkills=code"
  );
})();
