import IScope from "../../lib/interfaces/IScope";
import { isNullish } from "../../lib/utils";


exports.browse = (parent) : IScope => {

  const rules = {
    Date: (_) => (_) => ($1, $2, ...rest) => {
      let date;

      if (isNullish($1)) {
        date = new Date();
      } else if (isNullish($2)) {
        date = new Date($1);
      } else {
        date = new Date($1, $2, ...rest);
      }

      if (isNaN(date.valueOf())) {
        return null;
      }

      return new Map<string, string | number>([
        ["__type__", "Date"],
        ["value", date.valueOf()],
      ]);
    },
    date_fn: (_) => (_) => (/** @type Map */ map, fn: string, ...args: any[]) => {
      const date = new Date(map.get("value"));
      if (date.hasOwnProperty(fn)) {
        return (date as { [index: string] : any})[fn](...args);
      }
    },
  };

  const dateScope = {
    parent,
    vars: {},
    internal: {},
    modules: {},
    rules,
    close: async () => {}
  };

  return dateScope;
};
