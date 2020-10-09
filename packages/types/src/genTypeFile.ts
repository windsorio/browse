const browseParser = require("../../docs/parsers/browse");
const fs = require("fs");

import { argv } from "yargs";

const writeFile = (fileName: string) => {
  const code = fs.readFileSync(fileName).toString();
  const docTree = browseParser(code);
  console.log("Tree", docTree);
};

writeFile(argv._[0]);
