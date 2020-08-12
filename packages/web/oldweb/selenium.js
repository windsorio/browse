const { Builder, By, Key, until } = require("selenium-webdriver");
const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const firefox = require("selenium-webdriver/firefox");

let driver;

/*
 * Abstract out finding an element
 */

//Expose all the basic selenium actions
//
//(sendKeys, click,)
const seleniumAction = async ({ value, action, args = [], by = "xpath" }) => {
  return await driver.findElement(By[by](value))[action](...args);
};

const click = async (value) => await seleniumAction({ value, action: "click" });
const sendKeys = async (value) =>
  await seleniumAction({ value, action: "sendKeys" });
const wait = async (value) =>
  driver.wait(until.elementLocated(By.xpath(value)));

//Testing
(async () => {
  driver = await new Builder().forBrowser("chrome").build();
  try {
    await driver.get(
      "https://www.indiehackers.com/products?minRevenue=1&techSkills=code"
    );

    await wait(`.collapsible-filters--active`);
    await click(`.collapsible-filters--active`);
    await click(`.collapsible-filters__option--selected`);
    sleep(1000);
    await wait(`.product-card__link`);
  } finally {
    await driver.quit();
  }
})();
