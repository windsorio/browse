exports.browse = (parent) => {
  const sysScope = {
    parent,
    vars: {},
    internal: {},
    modules: {},
  };

  sysScope.rules = {
    argv: (_) => (_) => (n) => process.argv[n],
  };

  return sysScope;
};
