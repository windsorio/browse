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

const startingLines = [
  quote(
    "This was generated using BrowseDoc which is still very much a work in progress"
  ),
  line,
  h1("Table of Contents"),
  line,
];

const getDirectory = (docTree) => {
  const readmeLines = [];

  // mapping of a rulename to a link slug
  const ruleMap = {};

  //Build Documentation Directory (Inspired by https://nodejs.org/api/fs.html)
  readmeLines.push(
    bullet(
      Object.keys(docTree).map((scope) => {
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

        const vars = Object.keys(docTree[scope].vars || {}).map((variable) => {
          return link(shortcode(variable), `#${variable}`);
        });
        const configVars = Object.keys(
          docTree[scope].config || {}
        ).map((configVar) => link(`Config: ${configVar}`, `#${configVar}`));

        const entries = bullet([...vars, ...configVars, ...rules], 1);
        return `${link(
          `Scope: ${scope.trim()}`,
          `#scope-${scope.trim()}`
        )}\n${entries}`;
      })
    )
  );
  const childrenLines = Object.keys(docTree)
    .map((scope) => {
      if (docTree[scope]["children"]) {
        return getDirectory(docTree[scope]["children"]);
      }
    })
    .filter(Boolean);
  return [...readmeLines, ...childrenLines];
};

const getReadme = (docTree, file, directory = null) => {
  const ruleMap = {};
  const varMap = {};
  const readmeLines = [];
  //Build actual documentation
  Object.keys(docTree).map((scope) => {
    readmeLines.push(line);
    readmeLines.push(h2(`Scope ${shortcode(scope.trim())}`));
    readmeLines.push(line);
    readmeLines.push(subLinks(docTree[scope].description || "", ruleMap));
    readmeLines.push(line);

    const { vars, rules, config } = docTree[scope];
    if (vars && Object.keys(vars).length) {
      readmeLines.push(h2("Variables"));
      const varLines = Object.keys(vars).map((variable) => {
        const { help, desc, type } = vars[variable];
        return `${h3(shortcode(variable))}${type ? "\n" + italics(type) : ""}${
          desc ? "\n" + desc : help ? "\n" + help : ""
        }`;
      });
      readmeLines.push(...varLines);
    }
    if (rules && Object.keys(rules).length) {
      readmeLines.push(h2("Rules"));
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
            Object.keys(params)
              .map(
                (param) =>
                  Object.keys(params[param]).length &&
                  `${shortcode(param)} ${
                    params[param].type ? type(params[param].type) : ""
                  } ${subLinks(params[param].description || "", ruleMap)}`
              )
              .filter(Boolean),
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
      readmeLines.push(h2("Config"));
      const configLines = Object.keys(config).map((configVar) => {
        return `${h4(configVar)}\n( ${italics(config[configVar].type)} ) ${
          config[configVar].description
        }`;
      });
      readmeLines.push(bullet(configLines));
    }

    //Also write the children readme's below this one
    //TODO: Could indent, or have some special rendering for parents
    const childrenLines = docTree[scope]["children"]
      ? getReadme(docTree[scope]["children"], file)
      : [];
    readmeLines.push(...childrenLines);
  });

  return readmeLines;
};

module.exports = async (docTree, file) => {
  const directory = getDirectory(docTree);
  const readmeContents = getReadme(docTree, file);
  if (typeof file === "string") {
    await fs.promises.writeFile(
      file,
      [...startingLines, ...directory, ...readmeContents].join("\n")
    );
  }
};
