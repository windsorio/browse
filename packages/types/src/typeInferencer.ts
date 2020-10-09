/*
 * This code is complex. Tech debt in code this complex is incredibly costly. In order to promote maintainability, the naming schemes are very explicit as are the types at the cost of succinctness.
 *
 */

import { tiType, schemeT, varTT, substitution, typeEnv } from "./tiTypes";
import {
  boolT,
  numberT,
  plainStringT,
  cssStringT,
  jsStringT,
  nilT,
} from "./typeUtilities";

//import * as util from "util";

/*
const show = (...objs: any) =>
 objs.map((obj: any) =>
   console.log(util.inspect(obj, false, null, true))
 ); 
*/

const getFreeTypeVariables = (t: tiType): string[] => {
  switch (t._type) {
    case "var":
      return [t.name];
    case "number":
    case "bool":
    case "cssString":
    case "jsString":
    case "plainString":
    case "nil":
      return [];
    case "array":
      return getFreeTypeVariables(t.elemType);
    case "rule":
      return [
        ...getFreeTypeVariables(t.left),
        ...getFreeTypeVariables(t.right),
      ];
  }
};

const schemeGetFreeTypeVariables = (t: schemeT): string[] => {
  //The free variables in a polytype (scheme) are the variables which are in the type but not in the bound variables list
  return getFreeTypeVariables(t.type).filter(
    (freeVar: string) => !t.boundVars.includes(freeVar)
  );
};

const getAllFreeTypeVariables = (types: (tiType | schemeT)[]): string[] => {
  return types
    .map((t) => {
      if (t._type === "scheme") return schemeGetFreeTypeVariables(t);
      return getFreeTypeVariables(t);
    })
    .reduce((a, b) => a.concat(b), []);
};

const typeEnvGetFreeTypeVariables = (env: typeEnv): string[] => {
  return getAllFreeTypeVariables(Object.values(env));
};

export const applySubstitution = (s: substitution, t: tiType): tiType => {
  switch (t._type) {
    case "var":
      if (s[t.name]) {
        return s[t.name];
      }
      return t;
    case "rule":
      return {
        _type: "rule",
        left: applySubstitution(s, t.left),
        right: applySubstitution(s, t.right),
      };
    default:
      return t;
  }
};

const schemeApplySubstitution = (s: substitution, t: schemeT): schemeT => {
  //First we remove all bound variables from the substitution
  const newSub = { ...s };
  t.boundVars.forEach((v) => delete newSub[v]);
  //Then we apply the substitution
  const res = applySubstitution(newSub, t.type);
  //Return a new scheme with the same bound variables but with the substitution applied
  return {
    _type: "scheme",
    type: res,
    boundVars: t.boundVars,
  };
};

const typeEnvApplySubstitution = (s: substitution, env: typeEnv) => {
  const rtn: { [key: string]: schemeT } = {};
  Object.keys(env).forEach(
    (key) => (rtn[key] = schemeApplySubstitution(s, env[key]))
  );
  return rtn;
};

/*
 * Deletes variable from type environment without modyifying state.
 *
 * MIght want to optimize later but this reduces complexity for now
 */
const removeFromTypeEnv = (env: typeEnv, v: string) => {
  const newEnv = { ...env };
  delete newEnv[v];
  return newEnv;
};

/*
 * Generalize a type over all of the variables that are free in the type but not free in the type env
 */
const generalizeType = (env: typeEnv, t: tiType): schemeT => {
  return {
    _type: "scheme",
    type: t,
    boundVars: getFreeTypeVariables(t).filter(
      (v) => !typeEnvGetFreeTypeVariables(env).includes(v)
    ),
  };
};

/*
 * We need fresh type variables for a variety of purposes. This encapsulates that behavior
 */
export const freshVariableGenerator: () => (prefix: string) => varTT = () => {
  const nameMap: { [key: string]: number } = {};
  return (prefix: string): varTT => {
    if (!nameMap[prefix]) {
      nameMap[prefix] = 0;
    }
    return { _type: "var", name: prefix + ++nameMap[prefix] };
  };
};

/*
 * instantiates a scheme with fresh type variables.
 */
const instantiateScheme = (
  scheme: schemeT,
  varGen: (prefix: string) => varTT
) => {
  const freshVarSub: substitution = {};
  scheme.boundVars.forEach((v) => (freshVarSub[v] = varGen("a")));
  return applySubstitution(freshVarSub, scheme.type);
};

/*
 * Attempts to bind a type variable to a type
 *
 * Avoids binding a type variable to itself
 * e.g. in ((forall 'a') a -> a)
 *
 * We would never want to bind the type (a: varT) to a
 *
 * TODO: Finish explaination
 * If the variable is free in T
 */
const bindVar = (name: string, t: tiType): substitution => {
  if (t._type === "var" && name === t.name) return <substitution>{};
  if (getFreeTypeVariables(t).includes(name))
    throw new Error(`Occur Check Fails ${name} in ${JSON.stringify(t)}`);
  return { [name]: t };
};

/*
 * This is the function that is doing most of the inference work.
 *
 * Takes in two types and return the substitution required to make those types equal
 *
 * If there is no such substitution, this function throws and error.
 */
const unify = (t1: tiType, t2: tiType): substitution => {
  if (t1._type === "rule" && t2._type === "rule") {
    const sub1 = unify(t1.left, t2.left);
    const sub2 = unify(
      applySubstitution(sub1, t1.right),
      applySubstitution(sub1, t2.right)
    );
    return { ...sub1, ...sub2 };
  } else if (t1._type === "var") return bindVar(t1.name, t2);
  else if (t2._type === "var") return bindVar(t2.name, t1);
  else if (t1._type === "bool" && t2._type === "bool") return {};
  else if (t1._type === "array" && t2._type === "array")
    return unify(t1.elemType, t2.elemType);
  else if (t1._type === "number" && t2._type === "number") return {};
  else if (t1._type === "cssString" && t2._type === "cssString") return {};
  else if (t1._type === "jsString" && t2._type === "jsString") return {};
  else if (t1._type === "plainString" && t2._type === "plainString") return {};
  else
    throw new Error(
      `Types ${JSON.stringify(t1)} and ${JSON.stringify(t2)} do not unify`
    );
};

//TODO: make util functions for wrapping types. e.g plainStringT = { _type: plainStringT }
//TODO: use bool everywhere or use boolean everywhere
/*
 * This is the main type inference function which takes in an AST and returns the type tree
 */
//TODO: Type the expressions
//TODO: change the prefixes for new type variables so we can better track what's going on
//TODO: Check that object spreading meets the H-M spec for composition of substitutions
//TODO: Comment this function below
const typeInferencer = (
  env: typeEnv,
  expression: any,
  varGen: (prefix: string) => varTT
): { sub: substitution; type: tiType } => {
  //  show("Env", env);
  //  show("Tyep", expression.type);
  switch (expression.type) {
    case "App": {
      const typeVariable = varGen("a");
      //First we infer the type of the first expression
      const leftInference = typeInferencer(env, expression.e1, varGen);
      //Then we infer the type of the second expresion, using the context from the first
      const rightInference = typeInferencer(
        typeEnvApplySubstitution(leftInference.sub, env),
        expression.e2,
        varGen
      );
      let unificationSub;
      //TODO: Implement maybe monad to propogate errors. Use a context object which includes varGen
      try {
        //Now we unify the types of (The argument to the function) and (The argument passed in)
        unificationSub = unify(
          applySubstitution(rightInference.sub, leftInference.type),
          { _type: "rule", left: rightInference.type, right: typeVariable }
        );
      } catch (e) {
        console.log("Left Inference", leftInference);
        console.log("Right Inference", rightInference);
        console.log(`Failed on App Expression`, expression);
        throw e;
      }
      const type = applySubstitution(unificationSub, typeVariable);
      expression.node._type = type;
      return {
        sub: { ...leftInference.sub, ...rightInference.sub, ...unificationSub },
        type,
      };
    }
    case "Abs":
      const typeVariable = varGen("a");
      const newEnv = {
        ...removeFromTypeEnv(env, expression.arg),
        [expression.arg]: {
          _type: "scheme",
          type: typeVariable,
          boundVars: [],
        },
      };
      const inference = typeInferencer(newEnv, expression.e, varGen);
      const type = {
        _type: <"rule">"rule",
        left: applySubstitution(inference.sub, typeVariable),
        right: inference.type,
      };
      expression.node._type = type;
      return {
        sub: inference.sub,
        type,
      };
    case "Var":
      if (env[expression.name]) {
        const type = instantiateScheme(env[expression.name], varGen);
        expression.node._type = type;
        return {
          sub: {},
          type,
        };
      }
      throw new Error(`Unbound variable ${expression.name}`);
    case "Let": {
      const leftInference = typeInferencer(env, expression.e1, varGen);
      const generalType = generalizeType(
        typeEnvApplySubstitution(leftInference.sub, env),
        leftInference.type
      );
      const newEnv = {
        ...removeFromTypeEnv(env, expression.name),
        [expression.name]: generalType,
      };
      const rightInference = typeInferencer(
        typeEnvApplySubstitution(leftInference.sub, newEnv),
        expression.e2,
        varGen
      );
      const type = rightInference.type;
      expression.node._type = type;
      return {
        sub: { ...leftInference.sub, ...rightInference.sub },
        type,
      };
    }
    case "plainStringLit":
      expression.node._type = plainStringT;
      return { sub: {}, type: { _type: "plainString" } };
    case "jsStringLit":
      expression.node._type = jsStringT;
      return { sub: {}, type: { _type: "jsString" } };
    case "cssStringLit":
      expression.node._type = cssStringT;
      return { sub: {}, type: { _type: "cssString" } };
    case "numberLit":
      expression.node._type = numberT;
      return { sub: {}, type: { _type: "number" } };
    case "booleanLit":
      expression.node._type = boolT;
      return { sub: {}, type: { _type: "bool" } };
    case "nilLit":
      expression.node._type = nilT;
      return { sub: {}, type: { _type: "nil" } };
    default:
      console.log("Untypable expression", expression);
      throw new Error(
        `Cannot type expression of type ${expression.type}. No case in the inferencer`
      );
  }
};

export { typeInferencer };
