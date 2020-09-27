import EvalExprTypeEnum from "../../../core/lib/enums/EvalExprTypeEnum";

export default interface IASTNode {
  type: EvalExprTypeEnum,
  source: any
}
