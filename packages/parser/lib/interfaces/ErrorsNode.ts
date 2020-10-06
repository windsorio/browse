import ohm from "ohm-js";
import EqExprErrorType from "../types/EqExprErrorType";

export default interface ErrorsNode extends ohm.Node {
  errors: EqExprErrorType[];
}
