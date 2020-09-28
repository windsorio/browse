import ASTTypeEnum from "../../../core/lib/enums/ASTTypeEnum";

export default interface IASTNode {
  type: ASTTypeEnum,
  source: any
}
