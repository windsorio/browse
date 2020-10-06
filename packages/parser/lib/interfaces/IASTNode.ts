import { ASTTypeEnum } from "@browselang/shared";
import { Interval } from "ohm-js";

export default interface IASTNode {
  type: ASTTypeEnum;
  source: Interval;
}
