/* All of these functions take in context as their first argument */
const { sleep } = require("./std");

const _eval = async ({ page }, value, async = false) => {
  const fnWrapper = (value) => {
    return `
      ${async ? "async" : ""} () => {
        ${value}
      }
    `;
  };
  await page.evaluate(eval(fnWrapper(value)));
};

const _page = ({ pageDefs, fns }, { requiredArgs, optionalArgs }) => {
  const generateLambda = (ruleset) => {
    return async ({ page, browser, pageDefs, data }) => {
      const rtn = [];
      for (let i = 0; i < ruleset.length; i++) {
        const rule = ruleset[i];
        const name = rule[0];
        const args = rule.slice(1);
        if (name === "sleep") {
          rtn.push(sleep(...args));
        } else {
          console.log(
            `Executing ${name} with args ${args} on page ${page.url()}`
          );
          rtn.push(await fns[name]({ page, browser, pageDefs, data }, ...args));
        }
      }
      return rtn;
    };
  };

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

const _string = async ({ page, data }, name, value) => {
  const element = await page.$(value);
  const text = await page.evaluate((element) => element.textContent, element);
  if (!data[page.url()]) {
    data[page.url()] = [{ type: "string", name, value: text }];
  } else {
    data[page.url()].push({ type: "string", name, value: text });
  }
};

const _url = async ({ page, data }, name, value) => {
  const element = await page.$(value);
  const text = await page.evaluate((element) => element.textContent, element);
  if (!data[page.url()]) {
    data[page.url()] = [{ type: "url", name, value: text }];
  } else {
    data[page.url()].push({ type: "url", name, value: text });
  }
};

const click = async ({ page }, value) => await page.click(value);

const crawl = async ({ page, browser, pageDefs, data }, value) => {
  const matching = await page.evaluate(
    (value) =>
      Array.from(document.querySelectorAll(value), (elem) => elem.href),
    value
  );
  const pages = Promise.all(
    matching.map(async (href) => await visit({ browser, pageDefs, data }, href))
  );
  /*  for(let i = 0; i < matching.length; i ++) {
    await visit({ browser, pageDefs }, matching[i]);
  }*/
  await page.close();
  await pages;
  return pages;
};

const press = async ({ page }, value) => await page.keyboard.press(value);

const visit = async ({ browser, pageDefs, data }, href, newTab = true) => {
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
      if (i === 0)
        return await def.ruleSet({ page: newPage, browser, pageDefs, data });
      return false;
    })
  );
  return results;
};

const wait = async ({ page }, value) => await page.waitForSelector(value);

module.exports = {
  _eval,
  _page,
  _string,
  _url,
  click,
  crawl,
  press,
  visit,
  wait,
};
