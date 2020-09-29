const isNullish = (v) => v === undefined || v === null;
// TODO: isNullish is also declared on the utils file, what are the difference between them and why the are named the same

exports.browse = (parent) => {
  const dateScope = {
    parent,
    vars: {},
    internal: {},
    modules: {},
    rules: {}
  };

  dateScope.rules = {
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

  return dateScope;
};
