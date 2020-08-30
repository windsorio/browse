const parser = require("@browselang/parser");

const parseComments = (ast) => {
  const commentBlocks = ast.comments.reduce((p, c) => {
    if (p.length === 0) return [c];
    const last = p[p.length - 1];

    if (c.source.startIdx === last.source.endIdx + 1) {
      last.value += "\n";
      last.value += c.value;
      last.source.endIdx = c.source.endIdx;
    } else {
      p.push(c);
    }
    return p;
  }, []);

  console.log(commentBlocks);
};

module.exports = (code, fileName) => {
  const rtn = {};

  const ast = parser.parse(code);
  parseComments(ast);

  return rtn;
};
