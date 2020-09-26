import OperationTypes from "../types/OperationsTypes";

export default interface IExpression {
  op: OperationTypes,
  expr?: IExpression,
  left: any,
  right: any
}
