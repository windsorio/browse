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

//NOTE:
//  Any time a type is added in this file, a corresponding case will need to be added
//    In the type inferencer
//      1.) unify
//      2.) getFreeTypeVaribles
//
//    In the type utilities
//      1.) prettyPrintType
//      2.) A function to build the type (see varT, nilT ....)

//NOte the TT as opposed to T. Types are what are being passed around in the inferencer and these are the types of those types
export type tiType =
  | varTT
  | numberTT
  | boolTT
  | ruleTT
  | stringTT
  | nilTT
  | arrayTT;

export interface nilTT {
  _type: "nil";
}
/*
 * The _type of a cssString
 */
export interface cssStringTT {
  _type: "cssString";
}
/*
 * The _type of a jsString
 */
export interface jsStringTT {
  _type: "jsString";
}
/*
 * The _type of a string which is not a cssString or jsString
 */
export interface plainStringTT {
  _type: "plainString";
}
/*
 * The _type of any string in browse
 */
export type stringTT = cssStringTT | jsStringTT | plainStringTT;

/*
 * Type Variable _type
 */
export interface varTT {
  _type: "var";
  name: string;
}

/*
 * The _type of an integer
 */
export interface numberTT {
  _type: "number";
}

/*
 * The _type of a boolean
 */

export interface boolTT {
  _type: "bool";
}

/*
 * The _type of a rule (e.g int -> int -> int)
 */
export interface ruleTT {
  _type: "rule";
  left: tiType;
  right: tiType;
}

/*
 * The type of an array Array<int>
 */

export interface arrayTT {
  _type: "array";
  elemType: tiType;
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
