/**
 * A BrowseError which tracks the browse callstack. This is primarily for Rule
 * and RuleSet evaluations to use since we don't have lines we need to add to
 * the stacktrace anywhere else
 *
 * throwing a BrowseError that has no `node` set is the same as throwing a
 * regular Error, since the nearest evalRule or evalRuleSet will catch it and
 * use BrowseError.from to wrap it in a BrowseError
 */

const { getLineAndColumn } = require("ohm-js/src/util");

const B_RED = "\u001b[31;1m";
const WHITE = "\u001b[37m";
const DIM = "\u001b[2m";
const RESET = "\u001b[0m";

class BrowseError extends Error {
  constructor({ node, message }) {
    super("BrowseError");
    this.name = "BrowseError";
    this.node = node;
    this.message = message;
    this.astStack = [];
    if (node) {
      this.astStack.push({ node, source: node.source });
    }
  }

  static from(err, node = null) {
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

function stringifyError(err, opts = {}) {
  let msg = "";

  if (err instanceof BrowseError) {
    if (opts.snippet && err.node) {
      opts.color && (msg += WHITE);
      if (err.node.source) {
        msg += err.node.source
          .getLineAndColumnMessage()
          .split("\n")
          .slice(1)
          .join("\n");
      }
      msg += "\n";
      opts.color && (msg += RESET);
    }

    opts.color && (msg += B_RED);
    msg += err.message + "\n";
    opts.color && (msg += RESET);

    if (!opts.short) {
      opts.color && (msg += DIM);
      err.astStack.forEach(({ node, source }, i) => {
        let nodeName = "<...>";
        if (node) {
          switch (node.type) {
            case "Word":
              nodeName = node.name;
              break;
            case "Ident":
              nodeName = "$" + node.name;
              break;
            case "RuleSet":
              nodeName = "{ ... }";
              break;
          }
        }

        if (source) {
          const pos = getLineAndColumn(source.sourceString, source.startIdx);

          msg += `\tat ${nodeName} (${source.document}:${pos.lineNum}:${pos.colNum})`;
        } else {
          if (i < err.astStack.length - 1) {
            // This should never happen, but, if it does, it only needs to
            // appear in between the stack trace it's useless if it's the last
            // line. TODO: remove?
            msg += `\tat ${nodeName} (unknown)`;
          } else {
            return;
          }
        }
        msg += "\n";
      });
      opts.color && (msg += RESET);
    }

    if (process.env.BROWSE_DEBUG) {
      msg += "\n[DEBUG]\n";
      msg += err.stack;
    }
    return msg;
  } else if (err instanceof Error) {
    // TODO: JS error handling
    opts.color && (msg += B_RED);
    msg += err.message + "\n";
    opts.color && (msg += RESET);
  } else {
    opts.color && (msg += B_RED);
    msg += "Unknown Browse Error: " + String(err) + "\n";
    opts.color && (msg += RESET);
  }
  return msg;
}

module.exports = { BrowseError, stringifyError };
