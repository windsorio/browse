import * as fs from "fs";
import {
  multiArgRuleType,
  boolT,
  numberT,
  varT,
  plainStringT,
} from "./typeUtilities";

const basicScheme = (type: any, boundVars: string[] = []) => ({
  _type: <"scheme">"scheme",
  boundVars,
  type,
});

const rtnDef = multiArgRuleType([varT("b"), varT("b")]);
const sleepDef = multiArgRuleType([numberT, numberT]);

const ifDef = multiArgRuleType([
  boolT,
  plainStringT,
  varT("a"),
  plainStringT,
  varT("a"),
]);

const printDef = multiArgRuleType([varT("c"), varT("d")]);

const types = JSON.stringify({
  if: basicScheme(ifDef, ["a"]),
  return: basicScheme(rtnDef, ["b"]),
  sleep: basicScheme(sleepDef),
  print: basicScheme(printDef, ["c", "d"]),
});

fs.writeFileSync(
  "/home/andrew/browse/packages/types/src/std.browse.types",
  types
);
