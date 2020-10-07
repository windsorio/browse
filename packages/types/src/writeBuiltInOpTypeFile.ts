import * as fs from "fs";
import { multiArgRuleType, boolT, numberT, numericBin } from "./typeUtilities";

const leDef = multiArgRuleType([numberT, numberT, boolT]);

const basicScheme = (type: any, boundVars: string[] = []) => ({
  _type: <"scheme">"scheme",
  boundVars,
  type,
});

const types = JSON.stringify({
  "-": basicScheme(multiArgRuleType([numberT, numberT])),
  "!": basicScheme(multiArgRuleType([boolT, boolT])),
  "<=": basicScheme(leDef),
  "*": basicScheme(numericBin),
  "+": basicScheme(numericBin),
});

fs.writeFileSync(
  "/home/andrew/browse/packages/types/src/builtIn.browse.types",
  types
);
