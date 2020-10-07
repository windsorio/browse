import * as fs from "fs";
const parser = require("@browselang/parser");
import astTransformer from "./astTransformer";
import { typeInferencer, freshVariableGenerator } from "./typeInferencer";
import {
  multiArgRuleType,
  boolT,
  numberT,
  varT,
  plainStringT,
} from "./typeUtilities";

const code = fs.readFileSync(
  "/home/andrew/browse/packages/types/src/test.browse"
);
const tree = parser.parse(code.toString());
const leDef = multiArgRuleType([numberT, numberT, boolT]);
const numericBin = multiArgRuleType([numberT, numberT, numberT]);
const rtnDef = multiArgRuleType([varT("b"), varT("b")]);
const sleepDef = multiArgRuleType([numberT, numberT]);

//We would like to quantify over the variable 'a' here but I don't think HM allows it
const ifDef = multiArgRuleType([
  boolT,
  plainStringT,
  varT("a"),
  plainStringT,
  varT("a"),
]);

//TODO: Need to add array types for this to work
//TODO: Also need to add union types
const printDef = multiArgRuleType([varT("c"), varT("d")]);

const basicScheme = (type: any, boundVars: string[] = []) => ({
  _type: <"scheme">"scheme",
  boundVars,
  type,
});

console.log(
  JSON.stringify({
    "-": basicScheme(multiArgRuleType([numberT, numberT])),
    "!": basicScheme(multiArgRuleType([boolT, boolT])),
    "<=": basicScheme(leDef),
    "*": basicScheme(numericBin),
    "+": basicScheme(numericBin),
  })
);

console.log(
  "Type Inferencing",
  typeInferencer(
    {
      if: basicScheme(ifDef, ["a"]),
      "<=": basicScheme(leDef),
      return: basicScheme(rtnDef, ["b"]),
      "*": basicScheme(numericBin),
      "+": basicScheme(numericBin),
      sleep: basicScheme(sleepDef),
      print: basicScheme(printDef),
    },
    astTransformer(tree),
    freshVariableGenerator()
  )
);
