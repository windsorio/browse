import {
  boolTT,
  numberTT,
  plainStringTT,
  varTT,
  tiType,
  ruleTT,
  cssStringTT,
  jsStringTT,
  nilTT,
  arrayTT,
} from "./tiTypes";

const multiArgRuleType = (typeList: tiType[]): ruleTT => {
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

const boolT: boolTT = {
  _type: "bool",
};

const numberT: numberTT = {
  _type: "number",
};

const plainStringT: plainStringTT = {
  _type: "plainString",
};

const cssStringT: cssStringTT = {
  _type: "cssString",
};

const jsStringT: jsStringTT = {
  _type: "jsString",
};

const nilT: nilTT = {
  _type: "nil",
};

const varT = (name: string): varTT => ({
  _type: "var",
  name,
});

const arrayT = (elemType: tiType): arrayTT => ({
  _type: "array",
  elemType,
});

const numericBin = multiArgRuleType([numberT, numberT, numberT]);

const prettyPrintType = (t: tiType): string => {
  switch (t._type) {
    case "var":
      return "any";
    case "rule":
      return `(${prettyPrintType(t.left)}) -> (${prettyPrintType(t.right)})`;
    case "array":
      return `${t.elemType}[]`;
    default:
      return t._type;
  }
};

export {
  multiArgRuleType,
  boolT,
  numberT,
  plainStringT,
  cssStringT,
  jsStringT,
  varT,
  nilT,
  arrayT,
  numericBin,
  prettyPrintType,
};
