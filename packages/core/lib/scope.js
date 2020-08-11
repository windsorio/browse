/**
 * Recurseivlely find a function matching the name by walking up the scope/environment inheritance chain
 * @param {string} name The function/rule name
 * @param {Scope} scope The scope to use
 */
const resolveFn = (name, scope) => {
  if (!scope) {
    throw new Error(`Function '${name}' is not defined`);
  }
  if (scope.fns[name]) {
    return scope.fns[name];
  } else {
    return resolveFn(name, scope.parent);
  }
};

/**
 * Recurseivlely find a variable matching the name by walking up the scope/environment inheritance chain
 * @param {string} name The variable name
 * @param {Scope} scope The scope to use
 */
const resolveVar = (name, scope) => {
  if (!scope) {
    throw new Error(`Variable '${name}' is not defined`);
  }
  if (scope.vars[name]) {
    return scope.vars[name];
  } else {
    return resolveVar(name, scope.parent);
  }
};

/**
 * Recurseivlely find a variable matching the name by walking up the scope/environment inheritance
 * chain and return the containing scope, not the value
 * @param {string} name The variable name
 * @param {Scope} scope The scope to use
 */
const resolveVarScope = (name, scope) => {
  if (!scope) {
    throw new Error(`Variable '${name}' is not defined`);
  }
  if (scope.fns[name]) {
    return scope;
  } else {
    return resolveVarScope(name, scope.parent);
  }
};

module.exports = {
  resolveFn,
  resolveVar,
  resolveVarScope,
};
