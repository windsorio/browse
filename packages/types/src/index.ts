import {
  typeInferencer,
  freshVariableGenerator,
  applySubstitution,
} from "./typeInferencer";
import { prettyPrintType } from "./typeUtilities";
import { argv } from "yargs";
import { tiType } from "./tiTypes";
const fs = require("fs");
const parser = require("@browselang/parser");
const astTransformer = require("./astTransformer");

import * as util from "util";
const { dfsTraverse } = require("./astUtilities");

const show = (...objs: any) =>
  objs.map((obj: any) => console.log(util.inspect(obj, false, null, true)));

type runInfRtnT = {
  inferenceRes: { sub: { [key: string]: tiType }; type: tiType };
  ast: any;
};

//Takes in a list of browse.type files and uses the types to verify the browse file passed in
//@ts-ignore
const runInferencer = (typeFiles: string[], browseFile: string): runInfRtnT => {
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
  return {
    inferenceRes: typeInferencer(
      initTypeEnv,
      lambdaExp,
      freshVariableGenerator()
    ),
    ast,
  };
};

const inferencerResults = runInferencer(
  argv._.slice(0, argv._.length - 1),
  argv._[argv._.length - 1]
);

// Post processing
//   1.) Apply substitution for type variables
//   2.) Move the type from rules into the arguments
//   3.) Add a _pretty_type field
//

const postProcessing = (runInfRtn: runInfRtnT): void => {
  const { inferenceRes, ast } = runInfRtn;
  dfsTraverse(ast, (node: any) => {
    if (node._type) {
      node._type = applySubstitution(inferenceRes.sub, node._type);
      node._pretty_type = prettyPrintType(node._type);
    }
  });
};

postProcessing(inferencerResults);

show(inferencerResults);
