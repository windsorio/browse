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
const { shouldFlatten } = require("./utils");

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
      return group(
        concat(["{", indent(concat([line, group(concat(parts))])), line, "}"])
      );
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
      const parts = printBinExpr(
        path,
        print,
        options,
        /* isNested */ false,
        /* isInsideParenthesis */ false // TODO: implement checking for this
      );

      return concat(parts);
    }
    default:
      /* istanbul ignore next */
      throw new Error("unknown browse type: " + JSON.stringify(n.type));
  }
}

// Taken from
// https://github.com/prettier/prettier/blob/c4e9dd9c3672ded96f52a2c271a9658d0b2fe446/src/language-js/printer-estree.js#L4828-L4944
// and modified appropriately
//
// For binary expressions to be consistent, we need to group subsequent
// operators with the same precedence level under a single group. Otherwise they
// will be nested such that some of them break onto new lines but not all.
// Operators with the same precedence level should either all break or not.
// Because we group them by precedence level and the AST is structured based on
// precedence level, things are naturally broken up correctly, i.e. `&&` is
// broken before `+`.
function printBinExpr(path, print, options, isNested, isInsideParenthesis) {
  /** @type{Doc[]} */
  let parts = [];

  const node = path.getValue();

  if (node.type === "BinExpr") {
    // Put all operators with the same precedence level in the same group. The
    // reason we only need to do this with the `left` expression is because
    // given an expression like `1 + 2 - 3`, it is always parsed like `((1 + 2)
    // - 3)`, meaning the `left` side is where the rest of the expression will
    // exist. Binary expressions on the right side mean they have a difference
    // precedence level and should be treated as a separate group, so print them
    // normally. (This doesn't hold for the `**` operator, which is unique in
    // that it is right-associative.)
    if (shouldFlatten(node.op, node.left.op)) {
      // Flatten them out by recursively calling this function.
      parts = parts.concat(
        path.call(
          (left) =>
            printBinExpr(
              left,
              print,
              options,
              /* isNested */ true,
              isInsideParenthesis
            ),
          "left"
        )
      );
    } else {
      parts.push(group(path.call(print, "left")));
    }

    const right = concat([
      node.op,
      ifBreak(" (", ""),
      line,
      path.call(print, "right"),
      ifBreak(")", ""),
    ]);

    // If there's only a single binary expression, we want to create a group in
    // order to avoid having a small right part like -1 be on its own line.
    const parent = path.getParentNode();
    const shouldGroup =
      parent.type !== node.type &&
      node.left.type !== node.type &&
      node.right.type !== node.type;

    parts.push(" ", shouldGroup ? group(right, { shouldBreak: false }) : right);
  } else {
    // Our stopping case. Simply print the node normally.
    parts.push(group(path.call(print)));
  }

  return parts;
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
