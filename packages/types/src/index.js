const fs = require("fs");
const parser = require("@browselang/parser");

const code = fs.readFileSync("test.browse");
const astTransformer = require("./astTransformer");

//First we define the types
//
// PriExpr: ??
// UnaryExpr: not, neg
// MultExpr: multiplication, division, modulus, addition, subtraction
// CompExpr: >=, <=, >, <
// EqExpr: !=, ==
// AndExpr: &&
// OrExpr: ||
// Rule
// Rules
// RuleSet
// EmptyRuleSet
const expressions = [
  "PriExpr",
  "UnaryExpr",
  "MultExpr",
  "CompExpr",
  "EqExpr",
  "AndExpr",
  "OrExpr",
  "Rule",
  "RuleSet",
  "EmptyRuleSet",
];
const literals = [
  "nil",
  "Boolean",
  "Number",
  "DoubleQuotedString",
  "SingleQuotedString",
  "cssSelector",
  "Javascript",
  "Implicit",
];

const types = ["nilT", "BoolT", "NumT", "StringT", "RuleT", "TVar"];

const typeVarNums = {};

const freshTypeVar = (prefix) => {
  if (typeVarNums[prefix]) {
    typeVarNums[prefix]++;
  } else {
    typeVarNums[prefix] = 0;
  }
  return prefix + typeVarNums[prefix];
};

const instantiateScheme = (scheme) => {
  const substitution = {};
  scheme.vars.forEach((v) => (rtn[v] = freshTypeVar("a")));
  return applySubstitution(substitution, scheme.type);
};

//Base Cases
//
const TVar = (name) => ({
  type: "tvar",
  name,
});
const nilT = {
  type: "nil",
};

const boolT = {
  type: "bool",
};

const numT = {
  type: "num",
};

//Not technically a base case, there are many types of strings, but still a primitive type since it only represents finitely many types
const stringT = (stringKind) => ({
  type: "string",
  stringKind,
});

//Recursive case, can represet infinitely many types
const RuleT = (left, right) => ({
  type: "rule",
  left,
  right,
});

//Free type variables of a type
const getFreeTypeVariables = (type) => {
  switch (type.type) {
    case "nil":
    case "bool":
    case "num":
    case "string":
      return [];
    case "tvar":
      return [type.name];
    case "rule":
      return [
        ...getFreeTypeVariables(type.left),
        ...getFreeTypeVariables(type.right),
      ];
  }
};

const generalize = (typeEnv, type) => {
  return {
    variables: getFreeTypeVariables(type).filter(
      (v) => !Object.keys(typeEnv).contains(v)
    ),
    type,
  };
};

//Substitute for variable in type using substitution
const applySubstitution = (substitution, type) => {
  switch (type.type) {
    case "tvar":
      return substitution[type.name] !== undefined
        ? substitution[type.name]
        : type;
    case "rule":
      return RuleT(
        applySubstitution(substitution, type.left),
        applySubstitution(substitution, type.right)
      );
    default:
      return type;
  }
};

//Type unification: How can I make two types equal?
//
//Returns the substitions required to make two types equal
//
const unify = (t1, t2) => {
  switch (`${t1.type} ${t2.type}`) {
    case "nil":
    case "bool":
    case "num":
      return {};
    case "string":
      if (
        (["", "'", '"'].includes(t1.quoteType) &&
          ["", "'", '"'].includes(t2.quoteType)) ||
        t1.quoteType === t2.quoteType
      )
        return {};
      throw new Error("Could not reconcile types" + t1.type + "and" + t2.type);
    case "tvar nil":
    case "tvar bool":
    case "tvar num":
    case "tvar string":
    case "tvar rule":
      return { [t1.name]: t2 };
    case "nil tvar":
    case "bool tvar":
    case "num tvar":
    case "string tvar":
    case "rule tvar":
      return { [t2.name]: t1 };
    case "rule rule":
      const sub1 = unify(t1.left, t2.left);
      const sub2 = unify(
        applySubstitution(sub1, t1.right),
        applySubstitution(sub1, t2.right)
      );
      return { ...sub1, ...sub2 };
    default:
      throw new Error("Types" + t1 + "and" + t2 + "do not unify");
  }
};

const getArgsFromRuleset = (ruleset) => {
  return [].concat(
    ...ruleset.rules
      .filter((rule) => rule.fn.name.name === "bind")
      .map((rule) => rule.args.map((arg) => arg.value))
  );
};

//Think of the typeEnv as a mapping from variables to their types.
const inferTypes = (typeEnv) => (expression) => {
  console.log("Inferring types for expr", expression);
  switch (typeof expression) {
    case "number":
      return {
        substitution: {},
        type: numT,
      };
    case "string":
      return {
        substitution: {},
        type: stringT(expression.stringKind),
      };
    case "boolean":
      return {
        substitution: {},
        type: boolT,
      };
    case "object":
      if (expression === null) {
        return {
          substitution: {},
          type: nilT,
        };
      }
      switch (expression.type) {
        //Program node should consist of a list of rule nodes
        case "Program":
          return {
            rules: expression.rules.map((rule) => inferTypes(typeEnv)(rule)),
          };

        case "Ident":
          if (typeEnv[expression.name]) {
            return {
              substitution: {},
              type: instantiateScheme(typeEnv[expression.name]),
            };
          }
          throw new Error(`Unbound Variable: ${expression.name}`);
        //In the case of a ruleset, instead of arguments we use the bind operator, this means we actually need to parse the ruleset in order to figure out the 'arguments'
        //This is going to run into issues if a user ever uses a wrapper around bind (I'm assuming this behavior isn't going to be supported)
        case "RuleSet":
          console.log(getArgsFromRuleset(expression));
          return;
        case "Rule":
          switch (expression.fn.name) {
            //The "rule" rule is more like a let expression than a function call. We need to special case this for now.
            case "rule":
            //The AST Transformer has transformed the structure such that set is always the last rule in the ruleset, and such that the 'rules' array on set contains all of the subsequent rules
            //TODO: Setting the same variable multiple times is broken
            // The fix for this is to first convert to 'single static assignment' form before doing this transformation (https://en.wikipedia.org/wiki/Static_single_assignment_form)
            case "set":
              if (expression.tiType !== "Let")
                throw new Error(
                  "Cannot do type inferencing without first calling astTransformer"
                );
              const identifier = expression.args[0].value;
              const inferenceE1 = inferTypes(typeEnv)(expression.args[1]);
              const newEnv = { ...typeEnv };
              delete newEnv[identifier];
              const varType = generalize(
                applySubstitution(inferenceE1.substitution, typeEnv),
                inferenceE1.type
              );
              typeEnv[identifier] = varType;
              //TODO: can't use the rules array, need to use an expression as the second argument
              const inferenceE2 = inferTypes(
                applySubstitution(inferenceE1.substitution, typeEnv)
              )(expression.rules);
              return {
                substitution: {
                  ...inferenceE2.substitution,
                  ...inferenceE1.substitution,
                },
                type: inferenceE2.type,
              };

            default:
              //	  inferTypes(env)(expression.fn)
              return expression.args.map((arg) => inferTypes(typeEnv)(arg));
          }
        case "InitRule":
          expression.args.map((arg) => inferTypes(typeEnv)(arg));

        case "Literal":
          //TODO: We should implement multiple literal nodes: NilLiteral, NumericLiteral, StringLiteral etc... as per javascript ast spec.
          //Else we will always have to do ad-hoc type checking in our ast crawlers
          //TODO: Implement multiple string types
          return inferTypes(typeEnv)(expression.value);
        case "tvar":
          return [type.name];
        case "rule":
          return [
            ...getFreeTypeVariables(type.left),
            ...getFreeTypeVariables(type.right),
          ];
      }
    default:
      console.log(expression);
      throw new Error("Cannot type AST Node", expression);
  }
};

const typeInferencer = (program) => {
  return inferTypes({})(program);
};

//console.log("Code", code.toString());
const tree = parser.parse(code.toString());

console.log("Tree", JSON.stringify(tree));
console.log("AST Transformer", JSON.stringify(astTransformer(tree)));

//console.log(typeInferencer(astTransformer(tree)));
