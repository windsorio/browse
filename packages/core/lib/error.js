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
  const docment = opts.document || "unknown";

  let msg = "";
  opts.color && (msg += B_RED);
  msg += "Error\n";
  opts.color && (msg += RESET);

  if (err instanceof BrowseError) {
    if (opts.snippet && err.node) {
      opts.color && (msg += WHITE);
      msg += err.node.source
        .getLineAndColumnMessage()
        .split("\n")
        .slice(1)
        .join("\n");
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

          msg += `\tat ${nodeName} (${docment}:${pos.lineNum}:${pos.colNum})`;
        } else {
          if (i < err.astStack.length - 1) {
            // This only needs to appear in between the stack trace
            // it's useless if it's the last line
            msg += `\tat ${nodeName} (${docment})`;
          } else {
            return;
          }
        }
        msg += "\n";
      });
      opts.color && (msg += RESET);
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
