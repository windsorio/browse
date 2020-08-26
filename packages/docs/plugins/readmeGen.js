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
} = require("../readmeWriter");

const genReadme = (file) => {
  const readmeLines = [`${h1("Documentation")}`];
  Object.keys(docTree).map((scope) => {
    readmeLines.push(h2(scope));
    const { rules, config } = docTree[scope];
    if (rules) {
      readmeLines.push(h3("Rules"));
      const ruleLines = Object.keys(rules).map((rule) => {
        const ruleInfo = [];
        const { help, desc, params, rtn, example, notes } = rules[rule];
        if (desc) {
          ruleInfo.push(`\n  ${h4("Description")}\n${desc}`);
        } else if (help) {
          ruleInfo.push(`\n  ${h4("Description")}\n${help}`);
        } else {
          console.error(`Warning. Undocumented Rule ${rule}`);
        }

        if (params) {
          ruleInfo.push(`\n  ${h4("Parameters")}`);
          ruleInfo.push(
            bullet(
              params.map(
                (param) =>
                  `${bold(param.name)} ( ${italics(param.type)} ) ${
                    param.description
                  }`
              ),
              2
            )
          );
        }

        if (rtn) {
          ruleInfo.push(
            `\n  ${h4("Returns")}\n( ${italics(rtn.type)} ) ${rtn.description}`
          );
        }

        if (example) {
          ruleInfo.push(`\n  ${h4("example")}\n${code(example)}`);
        }

        if (notes) {
          ruleInfo.push(`\n  ${h4("Additional Notes")}\n${quote(notes)}`);
        }

        return [h3(rule), ...ruleInfo].join("\n");
      });
      readmeLines.push(bullet(ruleLines));
    }
  });

  if (file) fs.writeFileSync(file, readmeLines.join("\n"));
  return readmeLines.join("\n");
};

genReadme("generatedReadme.md");
