exports.browse = (parent) => {
  const mathScope = {
    parent,
    vars: {},
    internal: {},
    modules: {},
  };

  mathScope.rules = {
    fn: (_) => (_) => (fn, ...args) => Math[fn](...args),
  };

  return mathScope;
};
