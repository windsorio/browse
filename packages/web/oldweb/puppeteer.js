const puppeteer = require("puppeteer");
const { sleep } = require("./std");
const fns = require("./scrapeLib");

const pageDefs = {};

(async () => {
  const browser = await puppeteer.launch({ headless: false });

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
