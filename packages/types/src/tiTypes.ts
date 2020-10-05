/*
 * These are the _types needed for the _type inferencer
 *
 * NOTE: Every _type has an __type field indicating what _type it is
 *
 * This is so that at runtime we can switch on the _type
 */

/*
 * All of the _type inferencer _types
 */
export type tiType = varT | numberT | boolT | ruleT | stringT | nilT;

export interface nilT {
  _type: "nil";
}
/*
 * The _type of a cssString
 */
export interface cssStringT {
  _type: "cssString";
}
/*
 * The _type of a jsString
 */
export interface jsStringT {
  _type: "jsString";
}
/*
 * The _type of a string which is not a cssString or jsString
 */
export interface plainStringT {
  _type: "plainString";
}
/*
 * The _type of any string in browse
 */
export type stringT = cssStringT | jsStringT | plainStringT;

/*
 * Type Variable _type
 */
export interface varT {
  _type: "var";
  name: string;
}

/*
 * The _type of an integer
 */
export interface numberT {
  _type: "number";
}

/*
 * The _type of a boolean
 */

export interface boolT {
  _type: "bool";
}

/*
 * The _type of a rule (e.g int -> int -> int)
 */
export interface ruleT {
  _type: "rule";
  left: tiType;
  right: tiType;
}

/*
 * Type scheme type
 *
 * A type scheme is a type along with some forall quantifiers. (e.g. (for all 'a') a -> a)
 *
 * This consists of a type (Build from the above types) and a list of bound variables
 *
 * A bound variable is one declared within the type itself ( 'a in the above example is bound' )
 *
 * In the example ((for all 'a') a -> b) b is unbound and will not appear in the boundVars list
 *
 * In theory this is known as a 'polytype' (https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system#Polytypes)
 *
 */
export interface schemeT {
  _type: "scheme";
  type: tiType;
  boundVars: string[];
}

/*
 * This is a mapping from term variables to type schemes.
 *
 * This of this as keeping track of what type a variable could possibly be
 * as we commence type inferencing.
 */
export interface typeEnv {
  [key: string]: schemeT;
}

/*
 * A mapping of variable names to types
 */
export interface substitution {
  [key: string]: tiType;
}
