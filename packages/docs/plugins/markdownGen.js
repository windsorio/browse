/*
 * A plugin which uses the documentation tree to generate a rreadme as markdown
 */

const fs = require("fs");
const {
  h1,
  h2,
  h3,
  h4,
  bullet,
  bold,
  italics,
  shortcode,
  code,
  quote,
  link,
  line,
} = require("../utils/markdownPrinter");

const type = (str) =>
  `\\<${bold(str.trim().replace(/</, "\\<").replace(/>/, "\\>"))}\\>`;

const subLinks = (str, map) =>
  str.replace(/{@link\s*(\w+)}/g, (_, rule) =>
    link(rule.trim(), `#${map[rule.trim()] || rule.trim()}`)
  );

module.exports = async (docTree, file) => {
  const readmeLines = [
    quote(
      "This was generated using BrowseDoc which is still very much a work in progress"
    ),
    line,
    h1("Table of Contents"),
    line,
  ];

  // mapping of a rulename to a link slug
  const ruleMap = {};

  //Build Documentation Directory (Inspired by https://nodejs.org/api/fs.html)
  readmeLines.push(
    bullet(
      Object.keys(docTree).map((scope) => {
        // TODO: Will break if multiple rules have the same name in different scopes
        const rules = Object.keys(docTree[scope].rules).map((rule) => {
          let text = rule.trim();
          let slug = rule.trim();

          const { params } = docTree[scope].rules[rule];
          if (params) {
            Object.keys(params).forEach((param) => {
              text += " " + param.trim();
              slug += "-" + param.trim();
            });
          }

          ruleMap[rule.trim()] = slug;
          return link(shortcode(text), `#${slug}`);
        });

        const configVars = Object.keys(
          docTree[scope].config || {}
        ).map((configVar) => link(`Config: ${configVar}`, `#${configVar}`));

        const entries = bullet([...configVars, ...rules], 1);
        return `${link(
          `Scope: ${scope.trim()}`,
          `#scope-${scope.trim()}`
        )}\n${entries}`;
      })
    )
  );

  //Build actual documentation
  Object.keys(docTree).map((scope) => {
    readmeLines.push(line);
    readmeLines.push(h2(`Scope ${shortcode(scope.trim())}`));
    readmeLines.push(line);
    readmeLines.push(subLinks(docTree[scope].description || "", ruleMap));
    readmeLines.push(line);

    const { rules, config } = docTree[scope];
    if (rules && Object.keys(rules).length) {
      readmeLines.push(h3("Rules"));
      const ruleLines = Object.keys(rules).map((rule) => {
        const { help, desc, params, rtn, example, notes } = rules[rule];

        const out = {
          header: rule.trim(),
          desc: subLinks(desc || help || "", ruleMap),
          params: "",
          return: rtn
            ? bullet(
                [
                  `Returns: ${type(rtn.type)} ${subLinks(
                    rtn.description,
                    ruleMap
                  )}`,
                ],
                1
              )
            : "",
          example: example ? code(example, 1) : "",
          notes: subLinks(notes ? quote(notes, 1) : "", ruleMap),
        };

        if (params) {
          Object.keys(params).forEach(
            (param) => (out.header += " " + param.trim())
          );
          out.params = bullet(
            Object.keys(params).map(
              (param) =>
                `${shortcode(param)} ${type(params[param].type)} ${subLinks(
                  params[param].description || "",
                  ruleMap
                )}`
            ),
            1
          );
        }

        return `${h3(shortcode(out.header))}\n${out.params}\n${out.return}\n\n${
          out.desc
        }\n${out.notes}\n${out.example}\n\n`;
      });
      readmeLines.push(...ruleLines);
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

  if (typeof file === "string") {
    await fs.promises.writeFile(file, readmeLines.join("\n"));
  }
  return readmeLines.join("\n");
};
