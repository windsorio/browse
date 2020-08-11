/* All of these functions take in context as their first argument */

const _eval = async ({ page }, value, async = false) => {
  const fnWrapper = (value) => {
    return `
      ${async ? "async" : ""} () => {
        ${value}
      }
    `;
  };

  return await page.evaluate(eval(fnWrapper(value)));
};

const click = async ({ page }, value) => await page.click(value);

const crawl = async ({ page, browser, pageDefs }, value) => {
  const matching = await page.evaluate(
    (value) =>
      Array.from(document.querySelectorAll(value), (elem) => elem.href),
    value
  );
  const pages = await Promise.all(
    matching.map(async (href) => visit({ page, browser, pageDefs }, href))
  );
  return pages;
};

const visit = async ({ page, browser, pageDefs }, href, newTab = true) => {
  //const escapeRegExp = string => string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
  //TODO: We need to figure out how we're going to do regex as part of a URL where a lot of the characters are meant to be literals.
  //Alredy tried 'escape' and the like. The issue is that, for instance, 'space' being converted to multiple characters actually significantly effects the regex matching. For now we will ignore most regex characters.
  //Exluding (*, +, ., (, and ) )
  //My solution would be to implement a limited regex specifically for browse to drastically reduce collisions between regex characters and url characters. The few remaining collisions could be escaped.
  //
  //Alternatively we could define a regex transformer where ' *' for instance would be replaced with (%20)* and then we could use escape with traditional regex
  const escapeRegExp = (string) => string.replace(/[\-?^${}|[\]\\]/g, "\\$&");

  //TODO: Make this determinisitic, find a better way to do escaping
  //Scan the page definitions for all regex that match the href
  const scanPageDefs = (href) => {
    const regexps = Object.keys(pageDefs);
    return regexps
      .filter((r) => new RegExp(escapeRegExp(r), "g").test(href))
      .map((match) => ({ name: match, ruleSet: pageDefs[match] }));
  };

  const newPage = await browser.newPage();
  await newPage.goto(href);
  const matchingDefs = scanPageDefs(href);

  //Really this should be a promise race or something similar
  // For now we just take the first rule
  const results = await Promise.all(
    matchingDefs.map(async (def, i) => {
      if (i === 0) return await def.ruleSet(newPage);
      return false;
    })
  );
  return results;
};

const wait = async ({ page }, value) => await page.waitForSelector(value);

module.exports = {
  _eval,
  click,
  crawl,
  visit,
  wait,
};
