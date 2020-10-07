import { typeInferencer, freshVariableGenerator } from "./typeInferencer";
import { argv } from "yargs";

const fs = require("fs");
const parser = require("@browselang/parser");
const astTransformer = require("./astTransformer");

//console.log(typeInferencer(astTransformer(tree)));

//Takes in a list of browse.type files and uses the types to verify the browse file passed in
//@ts-ignore
const runInferencer = (typeFiles: string[], browseFile: string) => {
  console.log(`Typing ${browseFile} using type files [${typeFiles}]`);
  const code = fs.readFileSync(browseFile);
  const ast = parser.parse(code.toString());
  const lambdaExp = astTransformer(ast);
  const schemeMaps = typeFiles.map((file) =>
    JSON.parse(fs.readFileSync(file).toString())
  );
  const initTypeEnv = schemeMaps.reduce((prev, next) => {
    const rtn = { ...prev };
    Object.keys(next).forEach((varName) => {
      if (rtn[varName]) {
        throw new Error(`Error: Multiple definitions for var ${varName}`);
      }
      rtn[varName] = next[varName];
    });
    return rtn;
  }, {});

  //TODO: Move fresh variable generator to the typeInferencer
  return typeInferencer(initTypeEnv, lambdaExp, freshVariableGenerator());
};

const res = runInferencer(
  argv._.slice(0, argv._.length - 1),
  argv._[argv._.length - 1]
);

console.log(res);
