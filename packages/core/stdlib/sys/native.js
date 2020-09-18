exports.browse = (parent) => {
  const sysScope = {
    parent,
    vars: {},
    internal: {},
    modules: {},
  };

  sysScope.rules = {
    argv: (_) => (_) => (n) => process.argv[n],
    env: (_) => (_) => (key) => process.env[key],
    exit: (_) => (_) => (code) => process.exit(Number(code)),
  };

  return sysScope;
};
