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
  if (scope.vars[name] !== undefined) {
    return scope.vars[name];
  } else {
    return resolveVar(name, scope.parent);
  }
};

/**
 * Recurseivlely find a function matching the name by walking up the scope/environment inheritance
 * chain and return the containing scope, not the function
 * @param {string} name The function name
 * @param {Scope} scope The scope to use
 */
const resolveFnScope = (name, scope) => {
  if (!scope) {
    throw new Error(`Function '${name}' is not defined`);
  }
  if (scope.fns[name]) {
    return scope;
  } else {
    return resolveFnScope(name, scope.parent);
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
  if (scope.vars[name]) {
    return scope;
  } else {
    return resolveVarScope(name, scope.parent);
  }
};

/**
 * Recurseivlely find an internal variable matching the name by walking up the scope/environment inheritance chain
 * @param {string} name The variable name
 * @param {Scope} scope The scope to use
 */
const resolveInternal = (name, scope) => {
  if (!scope) {
    throw new Error(`Internal:: Internal Variable '${name}' is not defined`);
  }
  if (scope.internal[name] !== undefined) {
    return scope.internal[name];
  } else {
    return resolveInternal(name, scope.parent);
  }
};

module.exports = {
  resolveFn,
  resolveVar,
  resolveFnScope,
  resolveVarScope,
  resolveInternal,
};
