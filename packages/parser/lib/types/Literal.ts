import QuoteTypes from "./QuoteTypes";
import EvalExprTypeEnum from "../../../core/lib/enums/EvalExprTypeEnum";

type Literal = {

  type: EvalExprTypeEnum.Literal,
  value: string | number | null,
  source: any,
  quoteType?: QuoteTypes
 
}

export default Literal;
