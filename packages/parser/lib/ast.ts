/**
 * Utility functions to create AST nodes
 */
import Literal from "./types/Literal";
import EvalExprTypeEnum from "../../core/lib/enums/EvalExprTypeEnum";
import ILiteralCreator from "./interfaces/ILiteralCreator";

export function literal(params: ILiteralCreator): Literal {
  return {
    type: EvalExprTypeEnum.Literal,
    value: params.value,
    source: params.source,
    quoteType: params.quoteType
  }
}

// TODO: create more AST producer utilities, and expose these to consumers of
// @browselang/parser
