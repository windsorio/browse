/*
 * A plugin which uses the documentation tree to generate a readme
 */

const fs = require("fs");
const docTree = require("..")();
const {
  h1,
  h2,
  h3,
  h4,
  bullet,
  bold,
  italics,
  indentAll,
  code,
  quote,
  link,
} = require("../readmeWriter");

const { out } = require("yargs").argv;

const genReadme = (file) => {
  const readmeLines = [`${h1("Documentation")}`];

  //Build Documentation Directory (Inspired by https://nodejs.org/api/fs.html)
  //
  readmeLines.push(
    bullet(
      Object.keys(docTree).map((scope) => {
        //TODO: Will break if multiple rules have the same name in different scopes
        const rules = Object.keys(docTree[scope].rules).map((rule) =>
          link(`Rule: ${rule}`, `#${rule}`)
        );

        const configVars = Object.keys(docTree[scope].config).map((configVar) =>
          link(`Config: ${configVar}`, `#${configVar}`)
        );

        const entries = bullet([...configVars, ...rules], 1);
        return `${link(`Scope: ${scope}`, `#${scope}`)}\n${entries}`;
      })
    )
  );

  //Build actual documentation
  Object.keys(docTree).map((scope) => {
    readmeLines.push(h2(scope));
    readmeLines.push(docTree[scope].description);
    const { rules, config } = docTree[scope];
    if (rules && Object.keys(rules).length) {
      readmeLines.push(h3("Rules"));
      const ruleLines = Object.keys(rules).map((rule) => {
        const ruleInfo = [];
        const { help, desc, params, rtn, example, notes } = rules[rule];
        if (desc) {
          //          ruleInfo.push(`${h4("Description")}\n${desc}`);
          ruleInfo.push(desc);
        } else if (help) {
          //          ruleInfo.push(`${h4("Description")}\n${help}`);
          ruleInfo.push(help);
        } else {
          console.error(`Warning. Undocumented Rule ${rule}`);
        }

        if (params) {
          const paramList = bullet(
            Object.keys(params).map(
              (param) =>
                `${bold(param)} ( ${italics(params[param].type)} ) ${
                  params[param].description
                }`
            ),
            2
          );
          ruleInfo.push(`${h4("Parameters:")}\n${paramList}`);
        }

        if (rtn) {
          ruleInfo.push(
            `${h4("Returns")}\n${bullet(
              [`( ${italics(rtn.type)} ) ${rtn.description}`],
              3
            )}`
          );
        }

        if (example) {
          ruleInfo.push(`${h4("example")}\n${code(example)}`);
        }

        if (notes) {
          ruleInfo.push(`${h4("Additional Notes")}\n${quote(notes)}`);
        }

        return [h3(`${rule}:`), bullet(ruleInfo, 1)].join("\n");
      });
      readmeLines.push(bullet(ruleLines));
    }
    if (config && Object.keys(config).length) {
      readmeLines.push(h3("Config"));
      const configLines = Object.keys(config).map((configVar) => {
        return `${h4(configVar)}\n( ${italics(config[configVar].type)} ) ${
          config[configVar].description
        }`;
      });
      readmeLines.push(bullet(configLines));
    }
  });

  if (file) fs.writeFileSync(file, readmeLines.join("\n"));
  console.log(readmeLines.join("\n"));
  return readmeLines.join("\n");
};

genReadme(out);
