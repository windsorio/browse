#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const mkdirp = require("mkdirp");

const jsParser = require("./parsers/js");
const browseParser = require("./parsers/browse");
const markdownPlugin = require("./plugins/markdownGen");

const outDir = process.argv[2];

const directories = [
  "../core/lib",
  // "../web/lib",
  "../core/stdlib/datetime",
  "../core/stdlib/math",
];

const fileMap = Object.assign(
  {},
  ...directories.map((directory) => ({
    [directory]: fs.readdirSync(directory),
  }))
);

const main = async () => {
  const outPath = path.resolve(process.cwd(), outDir || ".");
  await mkdirp(outPath);

  const pages = (
    await Promise.all(
      [].concat(
        ...directories.map((directory) =>
          fileMap[directory].map(async (file) => {
            const ext = path.extname(file);
            if (ext === ".js") {
              const stem = path.basename(file, ".js");
              return [
                stem,
                jsParser(
                  await fs.promises.readFile(`${directory}/${file}`, "utf8"),
                  stem
                ),
              ];
            } else if (ext === ".browse") {
              const stem = path.basename(file, ".browse");
              return [
                stem,
                browseParser(
                  await fs.promises.readFile(`${directory}/${file}`, "utf8"),
                  stem
                ),
              ];
            }
          })
        )
      )
    )
  )
    .filter(Boolean)
    .filter(
      ([_, doc]) => typeof doc === "object" && Object.keys(doc).length > 0
    );

  const outputs = await Promise.all(
    pages.map(([stem, doc]) =>
      markdownPlugin(doc, path.join(outPath, stem + ".md"))
    )
  );

  // console.log(outputs);
};

main();
