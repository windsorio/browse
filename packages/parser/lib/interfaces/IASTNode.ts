import ASTTypeEnum from "../../../core/lib/enums/ASTTypeEnum";

import { Interval } from "ohm-js";

export default interface IASTNode {
  type: ASTTypeEnum,
  source: Interval
}
