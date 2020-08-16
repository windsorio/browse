const { BrowseError } = require("./error");

/**
 * Recursively find a function matching the name by walking up the scope/environment inheritance chain
 * @param {string | Word} name The function/rule name or Word AST node
 * @param {Scope} scope The scope to use
 */
const resolveFn = (name, scope) => {
  const varName = typeof name === "string" ? name : name.name;
  if (!scope) {
    throw new BrowseError({
      message: `Function '${varName}' is not defined`,
      node: typeof name === "string" ? null : name,
    });
  }
  if (scope.fns[varName]) {
    return scope.fns[varName];
  }

  return resolveFn(name, scope.parent);
};

/**
 * Recursively find a variable matching the name by walking up the scope/environment inheritance chain
 * @param {string | Ident} name The variable name
 * @param {Scope} scope The scope to use
 */
const resolveVar = (name, scope) => {
  const varName = typeof name === "string" ? name : name.name;
  if (!scope) {
    throw new BrowseError({
      message: `Variable '${varName}' is not defined`,
      node: typeof name === "string" ? null : name,
    });
  }

  if (scope.vars[varName] !== undefined) {
    return scope.vars[varName];
  }

  return resolveVar(name, scope.parent);
};

/**
 * Recursively find a function matching the name by walking up the scope/environment inheritance
 * chain and return the containing scope, not the function
 * @param {string | Word} name The function name
 * @param {Scope} scope The scope to use
 */
const resolveFnScope = (name, scope) => {
  const varName = typeof name === "string" ? name : name.name;
  if (!scope) {
    throw new BrowseError({
      message: `Function '${varName}' is not defined`,
      node: typeof name === "string" ? null : name,
    });
  }
  if (scope.fns[varName]) {
    return scope;
  } else {
    return resolveFnScope(name, scope.parent);
  }
};

/**
 * Recursively find a variable matching the name by walking up the scope/environment inheritance
 * chain and return the containing scope, not the value
 * @param {string | Ident} name The variable name
 * @param {Scope} scope The scope to use
 */
const resolveVarScope = (name, scope) => {
  const varName = typeof name === "string" ? name : name.name;
  if (!scope) {
    throw new BrowseError({
      message: `Variable '${varName}' is not defined`,
      node: typeof name === "string" ? null : name,
    });
  }
  if (scope.vars[varName]) {
    return scope;
  } else {
    return resolveVarScope(name, scope.parent);
  }
};

/**
 * Recursively find an internal variable matching the name by walking up the scope/environment inheritance chain
 * @param {string} name The variable name
 * @param {Scope} scope The scope to use
 * @param {any => boolean} predicate An optional predicate with which to test the resolved value
 */
const resolveInternal = (name, scope, predicate = () => true) => {
  if (!scope) {
    throw new Error(`Internal:: Internal Variable '${name}' is not defined`);
  }
  if (scope.internal[name] !== undefined && predicate(scope.internal[name])) {
    return scope.internal[name];
  } else {
    return resolveInternal(name, scope.parent, predicate);
  }
};

/**
 * Recursively find an internal variable matching the name by walking up the scope/environment inheritance chain
 * and return the scope instead of the value itself
 * @param {string} name The variable name
 * @param {Scope} scope The scope to use
 */
const resolveInternalScope = (name, scope) => {
  if (!scope) {
    throw new Error(`Internal:: Internal Variable '${name}' is not defined`);
  }
  if (scope.internal[name] !== undefined) {
    return scope;
  } else {
    return resolveInternalScope(name, scope.parent);
  }
};

/**
 * Recursively find an internal variable matching the name by walking up the scope/environment inheritance chain
 * and return the scope instead of the value itself
 * @param {scope => boolean} f the function used to check if we're in a scope
 * @param {Scope} scope The scope to use
 */
const validateScope = (f, scope, withError = false) => {
  const inScope = f(scope);
  if (inScope) return true;
  if (scope.parent) {
    return validateScope(f, scope.parent);
  }
  if (!scope && withError) {
    throw new Error(`Internal:: Internal Variable '${name}' is not defined`);
  }
  return false;
};

module.exports = {
  resolveFn,
  resolveVar,
  resolveFnScope,
  resolveVarScope,
  resolveInternal,
  resolveInternalScope,
  validateScope,
};
