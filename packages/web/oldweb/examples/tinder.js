const puppeteer = require("puppeteer");
const fns = require("../scrapeLib");
const pageDefs = {};
const data = {};
//I *think* this concept (rulesets) needs to be implemented at the js level because passing rulesets around isn't the same as passing lambdas around and the JS code might need to know that in some cases.
fns._page(
  { pageDefs, fns },
  {
    requiredArgs: [
      // The url
      "https://tinder.com",
      [
        //The ruleset
        [
          "wait",
          "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button",
        ],
        [
          "click",
          "#modal-manager > div > div > div.Ta\\(c\\).H\\(100\\%\\).D\\(f\\).Fld\\(c\\).Pos\\(r\\) > div > div:nth-child(4) > span > div:nth-child(3) > button",
        ],
        [
          "wait",
          "#modal-manager > div > div > div.Ta\\(c\\).Expand.Mx\\(a\\) > div.D\\(b\\).My\\(12px\\).My\\(24px\\)--ml.Mx\\(a\\) > div > input",
        ],
        [
          "click",
          "#modal-manager > div > div > div.Ta\\(c\\).Expand.Mx\\(a\\) > div.D\\(b\\).My\\(12px\\).My\\(24px\\)--ml.Mx\\(a\\) > div > input",
        ],
        ["press", "7"],
        ["press", "4"],
        ["press", "0"],
        ["press", "6"],
        ["press", "0"],
        ["press", "6"],
        ["press", "8"],
        ["press", "9"],
        ["press", "6"],
        ["press", "8"],
        [
          "click",
          "#modal-manager > div > div > div.Ta\\(c\\).Expand.Mx\\(a\\) > button",
        ],
      ],
    ],
    optionalArgs: {},
  }
);

(async () => {
  const browser = await puppeteer.launch({ headless: false });

  const res = await fns.visit(
    { browser, pageDefs, data },
    //Starting URL
    "https://tinder.com"
  );
})();
