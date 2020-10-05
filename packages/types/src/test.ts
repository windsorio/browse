import * as fs from "fs";
const parser = require("@browselang/parser");
import astTransformer from "./astTransformer";
import { typeInferencer, freshVariableGenerator } from "./typeInferencer";

console.log(__dirname);
const code = fs.readFileSync(
  "/home/andrew/browse/packages/types/src/test.browse"
);

const tree = parser.parse(code.toString());

console.log("Tree", JSON.stringify(tree));
console.log("AST Transformer", JSON.stringify(astTransformer(tree)));

//TODO: Move these utils to a util file
//TODO: fix types
const multiArgRuleType = (args: any): any => {
  if (args.length === 2) {
    return {
      _type: "rule",
      left: args[0],
      right: args[1],
    };
  }
  return {
    _type: "rule",
    left: args[0],
    right: multiArgRuleType(args.slice(1)),
  };
};

const boolT = {
  _type: "bool",
};

const numberT = {
  _type: "number",
};

const plainStringT = {
  _type: "plainString",
};

const varT = {
  _type: "var",
  name: "a",
};

//We would like to quantify over the variable 'a' here but I don't think HM allows it
const ifDef = multiArgRuleType([boolT, plainStringT, varT, plainStringT, varT]);

const leDef = multiArgRuleType([numberT, numberT]);

const basicScheme = (type: any, boundVars: string[] = []) => ({
  _type: <"scheme">"scheme",
  boundVars,
  type,
});

console.log(
  "Type Inferencing",
  typeInferencer(
    { if: basicScheme(ifDef), "<=": basicScheme(leDef) },
    astTransformer(tree),
    freshVariableGenerator()
  )
);
