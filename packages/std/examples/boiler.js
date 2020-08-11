const puppeteer = require("puppeteer");
const fns = require("./scrapeLib");
const pageDefs = {};

//I *think* this concept (rulesets) needs to be implemented at the js level because passing rulesets around isn't the same as passing lambdas around and the JS code might need to know that in some cases.
fns._page(
  { pageDefs, fns },
  {
    requiredArgs: [
      // The url
      "https://en.wikipedia.org/wiki/(slug:.+)",
      [
        ["_string", "title", "#firstHeading"],
        ["_string", "summary", "#mw-content-text > div > p:nth-child(4)"],
        //The ruleset
      ],
    ],
    optionalArgs: {},
  }
);

(async () => {
  const browser = await puppeteer.launch({ headless: false });

  const res = await fns.visit(
    { browser, pageDefs },
    //Starting URL
    "https://en.wikipedia.org/wiki/%22Hello,_World!%22_program"
  );
})();
