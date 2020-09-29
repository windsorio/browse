/**
 * A BrowseError which tracks the browse callstack. This is primarily for Rule
 * and RuleSet evaluations to use since we don't have lines we need to add to
 * the stacktrace anywhere else
 *
 * throwing a BrowseError that has no `node` set is the same as throwing a
 * regular Error, since the nearest evalRule or evalRuleSet will catch it and
 * use BrowseError.from to wrap it in a BrowseError
 */

export default class BrowseError extends Error {

  name: string
  node: any
  astStack: Array<any>

  constructor(params: { node?: { source?: any, [index: string]: any }, message: string }) {

    super("BrowseError");
    this.name = "BrowseError";
    this.node = params.node;
    this.message = params.message;
    this.astStack = [];
    if (this.node) {
      this.astStack.push({ node: this.node, source: this.node.source });
    }
  }

  static from(err: any, node: any = null) {
    if (err instanceof BrowseError) {
      err.node = err.node || node;
      err.astStack.push({
        node,
        source: node ? node.source : null,
      });
      return err;
    } else {
      return new BrowseError({ message: err.message, node });
    }
  }
}
