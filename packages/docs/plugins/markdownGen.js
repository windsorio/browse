#!/usr/bin/env node
/*
 * A plugin which uses the documentation tree to generate a rreadme as markdown
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
  shortcode,
  code,
  quote,
  link,
  line,
} = require("../markdownPrinter");

const { out } = require("yargs").argv;

const type = (str) =>
  `\\<${bold(str.trim().replace(/</, "\\<").replace(/>/, "\\>"))}\\>`;

const genReadme = (file) => {
  const readmeLines = [
    quote(
      "This was generated using BrowseDoc which is still very much a work in progress"
    ),
    line,
    h1("Table of Contents"),
    line,
  ];

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
          return link(shortcode(text), `#${slug}`);
        });

        const configVars = Object.keys(
          docTree[scope].config || {}
        ).map((configVar) => link(`Config: ${configVar}`, `#${configVar}`));

        const entries = bullet([...configVars, ...rules], 1);
        return `${link(`Scope: ${scope}`, `#${scope}`)}\n${entries}`;
      })
    )
  );

  //Build actual documentation
  Object.keys(docTree).map((scope) => {
    readmeLines.push(line);
    readmeLines.push(h2(`Scope ${shortcode(scope)}`));
    readmeLines.push(line);
    readmeLines.push(docTree[scope].description);
    readmeLines.push(line);

    const { rules, config } = docTree[scope];
    if (rules && Object.keys(rules).length) {
      readmeLines.push(h3("Rules"));
      const ruleLines = Object.keys(rules).map((rule) => {
        const { help, desc, params, rtn, example, notes } = rules[rule];

        const out = {
          header: rule.trim(),
          desc: desc || help || "",
          params: "",
          return: rtn
            ? bullet([`Returns: ${type(rtn.type)} ${rtn.description}`], 1)
            : "",
          example: example ? code(example, 1) : "",
          notes: notes ? quote(notes, 1) : "",
        };

        if (params) {
          Object.keys(params).forEach(
            (param) => (out.header += " " + param.trim())
          );
          out.params = bullet(
            Object.keys(params).map(
              (param) =>
                `${shortcode(param)} ${type(params[param].type)} ${
                  params[param].description
                }`
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
    fs.writeFileSync(file, readmeLines.join("\n"));
  } else {
    console.log(readmeLines.join("\n"));
  }
  return readmeLines.join("\n");
};

genReadme(out);
