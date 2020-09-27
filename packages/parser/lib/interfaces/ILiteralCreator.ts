import QuoteTypes from "../types/QuoteTypes";

export default interface ILiteralCreator {
  value: string | number | null,
  source: any,
  quoteType?: QuoteTypes
}
