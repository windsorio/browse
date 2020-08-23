/**
 * TODO: Update the printer from GraphQL to Browse
 */

"use strict";

const {
  concat,
  join,
  hardline,
  line,
  softline,
  group,
  indent,
  ifBreak,
} = require("../document").builders;
const { hasIgnoreComment, isNextLineEmpty } = require("../common/util");

function genericPrint(path, options, print) {
  const n = path.getValue();
  if (!n) {
    return "";
  }

  if (typeof n === "string") {
    return n;
  }

  switch (n.type) {
    case "Program": {
      const parts = [];
      path.map((pathChild, index) => {
        parts.push(pathChild.call(print));
        if (index !== n.rules.length - 1) {
          parts.push(hardline);
          if (
            isNextLineEmpty(
              options.originalText,
              pathChild.getValue(),
              options.locEnd
            )
          ) {
            parts.push(hardline);
          }
        }
      }, "rules");
      return concat([concat(parts), hardline]);
    }
    case "RuleSet": {
      const parts = [];
      path.map((pathChild, index) => {
        parts.push(pathChild.call(print));
        if (index !== n.rules.length - 1) {
          parts.push(ifBreak("", "; "), softline);
          if (
            isNextLineEmpty(
              options.originalText,
              pathChild.getValue(),
              options.locEnd
            )
          ) {
            parts.push(hardline);
          }
        }
      }, "rules");
      return concat([
        "{",
        indent(concat([hardline, group(concat(parts))])),
        hardline,
        "}",
      ]);
    }
    case "Rule": {
      return concat([
        path.call(print, "fn"),
        join(" ", path.map(print, "args")),
      ]);
    }
    case "InitRule": {
      return concat([
        path.call(print, "name"),
        n.options.length
          ? group(
              concat([
                "(",
                indent(
                  concat([
                    softline,
                    join(
                      concat([ifBreak("", " "), softline]),
                      path.map(print, "options")
                    ),
                  ])
                ),
                softline,
                ")",
              ])
            )
          : "",
        " ",
      ]);
    }
    case "RuleExpr":
    case "Paren": {
      return concat(["(", path.call(print, "expr"), ")"]);
    }
    case "Word": {
      return n.name;
    }
    case "Ident": {
      return concat(["$", n.name]);
    }
    case "Option": {
      const isBool =
        n.value.type === "Literal" && typeof n.value.value === "boolean";
      if (isBool) {
        return concat([!n.value.value ? "!" : "", path.call(print, "key")]);
      } else {
        return concat([
          path.call(print, "key"),
          "=",
          path.call(print, "value"),
        ]);
      }
      return "opt";
    }
    case "Literal": {
      if (typeof n.value === "string") {
        return concat([n.quoteType, n.value, n.quoteType]);
      } else {
        return String(n.value);
      }
    }

    case "UnaryExpr": {
      return concat([n.op, path.call(print, "expr")]);
    }
    case "BinExpr": {
      return concat([
        path.call(print, "left"),
        n.op,
        path.call(print, "right"),
      ]);
    }
    default:
      /* istanbul ignore next */
      throw new Error("unknown browse type: " + JSON.stringify(n.type));
  }
}

function canAttachComment(node) {
  return node.type && node.type !== "Comment";
}

function printComment(commentPath) {
  const comment = commentPath.getValue();
  if (comment.type === "Comment") {
    return "#" + comment.value.trimEnd();
  }

  /* istanbul ignore next */
  throw new Error("Not a comment: " + JSON.stringify(comment));
}

function clean(node, newNode /*, parent*/) {
  // delete newNode.loc;
  delete newNode.comments;
}

module.exports = {
  print: genericPrint,
  massageAstNode: clean,
  hasIgnore: hasIgnoreComment,
  printComment,
  canAttachComment,
};
