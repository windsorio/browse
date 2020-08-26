const isNullish = (v) => v === undefined || v === null;

exports.browse = (parent) => {
  const dateScope = {
    parent,
    vars: {},
    internal: {},
    modules: {},
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

      return new Map([
        ["__type__", "Date"],
        ["value", date.valueOf()],
      ]);
    },
    date_fn: (_) => (_) => (/** @type Map */ map, fn, ...args) => {
      const date = new Date(map.get("value"));
      return date[fn](...args);
    },
  };

  return dateScope;
};
