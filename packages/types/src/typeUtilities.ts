import { boolT, numberT, plainStringT, varT, tiType, ruleT } from "./tiTypes";

const multiArgRuleType = (typeList: tiType[]): ruleT => {
  if (typeList.length < 2)
    throw new Error(`Cannot create a rule type from less than 2 types`);
  if (typeList.length === 2) {
    return {
      _type: "rule",
      left: typeList[0],
      right: typeList[1],
    };
  }
  return {
    _type: "rule",
    left: typeList[0],
    right: multiArgRuleType(typeList.slice(1)),
  };
};

const boolT: boolT = {
  _type: "bool",
};

const numberT: numberT = {
  _type: "number",
};

const plainStringT: plainStringT = {
  _type: "plainString",
};

const varT = (name: string): varT => ({
  _type: "var",
  name,
});

const numericBin = multiArgRuleType([numberT, numberT, numberT]);

export { multiArgRuleType, boolT, numberT, plainStringT, varT, numericBin };
