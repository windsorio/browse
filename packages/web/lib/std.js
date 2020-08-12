const puppeteer = require("puppeteer");
const { resolveMeta } = require("./scope");

/**
 * The root scope that contains all the basic/standard functions and variables
 */
module.exports = ({ evalAsyncRuleSet, getNewScope }) => ({
  parent: null, // This is the root
  vars: {},
  meta: {
    //A single browser for now
    browser: undefined,
    //Page definitions
    pageDefs: {},
    data: {},
    page: undefined,
  },
  fns: {
    click: (scope) => async (value) => {
      await resolveMeta("page", scope).click(value);
      return true;
    },
    //This is purely for CLI. Calling info prints out the info for all functions.
    //Calling info with a function name prints out the definition for that function
    info: (scope) => (value) => {
      const fnDescriptions = {
        click:
          "Takes in a selector and clicks the argument indicated by the selector",
        info:
          "Prints out info about all of the functions if given no arguemnts. If given an argument, prints out info about the function whose name was passed",
        page:
          "Defines a page definition which matches on the regex passed in as the first argument, and which executes the rule set passed in as the second argument on every matching page",
        press: "Presses the given key",
        type: "Types the given string one character at a time",
        visit: "Open a new tab with the given url",
        wait:
          "If pased a number, waits for that many ms. If passed a selector, waits for that selector to be renderered",
      };
      if (!value) {
        Object.keys(fnDescriptions).forEach((key) => {
          console.log(`(${key}): ${fnDescriptions[key]}`);
          console.log("");
        });
      } else {
        if (fnDescriptions[value]) {
          console.log(fnDescriptions[value]);
        } else {
          throw new Error(
            `Function ${value} does not exist in the info description`
          );
        }
      }
      return true;
    },
    page: (scope) => (hrefRegex, ...rulesets) => {
      if (rulesets.length > 1) {
        console.log("We only support one ruleset for now");
      }

      //We now have a rule for this href Regex so we push it
      resolveMeta("pageDefs", scope)[hrefRegex] = rulesets[0];
      return true;
    },
    press: (scope) => async (value) => {
      await resolveMeta("page", scope).keyboard.press(value);
      return value;
    },
    type: (scope) => async (value) => {
      const keys = [...value];
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        await resolveMeta("page", scope).keyboard.press(key);
      }
      return value;
    },
    visit: (scope) => async (href) => {
      try {
        //TODO: Def isDefined so we don't have to error catch
        resolveMeta("browser", scope);
      } catch (e) {
        scope.meta.browser = await puppeteer.launch({ headless: false });
      }

      //const escapeRegExp = string => string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
      //TODO: We need to figure out how we're going to do regex as part of a URL where a lot of the characters are meant to be literals.
      //Alredy tried 'escape' and the like. The issue is that, for instance, 'space' being converted to multiple characters actually significantly effects the regex matching. For now we will ignore most regex characters.
      //Exluding (*, +, ., (, and ) )
      //My solution would be to implement a limited regex specifically for browse to drastically reduce collisions between regex characters and url characters. The few remaining collisions could be escaped.
      //
      //Alternatively we could define a regex transformer where ' *' for instance would be replaced with (%20)* and then we could use escape with traditional regex
      const escapeRegExp = (string) =>
        string.replace(/[\-?^${}|[\]\\]/g, "\\$&");

      //TODO: Make this determinisitic, find a better way to do escaping
      //Scan the page definitions for all regex that match the href
      const scanPageDefs = (href) => {
        const regexps = Object.keys(resolveMeta("pageDefs", scope));
        return regexps
          .filter((r) => new RegExp(escapeRegExp(r), "g").test(href))
          .map((match) => ({
            name: match,
            ruleSet: resolveMeta("pageDefs", scope)[match],
          }));
      };

      const newPage = await resolveMeta("browser", scope).newPage();

      await newPage.goto(href);

      scope.meta.page = newPage;

      const matchingDefs = scanPageDefs(href);

      //Really this should be a promise race or something similar
      // For now we just take the first rule
      const results = await Promise.all(
        matchingDefs.map(async (def, i) => {
          console.log("Def", def);
          if (i === 0) {
            //            const newScope = getNewScope(scope);
            //            newScope.meta.page = newPage;
            return evalAsyncRuleSet(def.ruleSet, scope);
          }
          return false;
        })
      );
      return href;
    },
    wait: (scope) => async (value) => {
      if (typeof value === "number") {
        await resolveMeta("page", scope).waitFor(value);
        return value;
      }
      const rtn = await resolveMeta("page", scope).waitForSelector(value);
      return value;
    },
  },
});
