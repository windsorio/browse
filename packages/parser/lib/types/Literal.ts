import QuoteTypes from "./QuoteTypes";
import ASTTypeEnum from "../../../core/lib/enums/ASTTypeEnum";

type Literal = {

  type: ASTTypeEnum.Literal,
  value: string | number | null,
  source: any,
  quoteType?: QuoteTypes
 
}

export default Literal;
