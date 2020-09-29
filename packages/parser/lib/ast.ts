/**
 * Utility functions to create AST nodes
 */
import Literal from "./types/Literal";
import ASTTypeEnum from "@browselang/shared";
import ILiteralCreator from "./interfaces/ILiteralCreator";

export function literal(params: ILiteralCreator): Literal {
  return {
    type: ASTTypeEnum.Literal,
    value: params.value,
    source: params.source,
    quoteType: params.quoteType
  }
}

// TODO: create more AST producer utilities, and expose these to consumers of
// @browselang/parser
