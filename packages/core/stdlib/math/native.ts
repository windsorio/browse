import IScope from "../../lib/interfaces/IScope";

exports.browse = (parent) : IScope => {
  
  const rules = {
    proto: (_) => (_) => (fn, num, ...args) => num[fn](...args),
    fn: (_) => (_) => (fn, ...args) => Math[fn](...args),
  };

  const mathScope = {
    parent,
    vars: {},
    internal: {},
    modules: {},
    rules,
    close: async () => {},
  };

  return mathScope;
};
