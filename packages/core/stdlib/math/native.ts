exports.browse = (parent) => {
  const mathScope = {
    parent,
    vars: {},
    internal: {},
    modules: {},
  };

  mathScope.rules = {
    proto: (_) => (_) => (fn, num, ...args) => num[fn](...args),
    fn: (_) => (_) => (fn, ...args) => Math[fn](...args),
  };

  return mathScope;
};
