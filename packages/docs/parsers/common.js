const safeMergeObjs = (o1, o2) => {
  const rtn = { ...o2 };
  Object.keys(o1).forEach((key) => {
    if (rtn[key] !== undefined) {
      const throwStr = `Cannot define key ${key} multiple times on the same structure`;
      throw new Error(throwStr);
    }
    rtn[key] = o1[key];
  });
  return rtn;
};

const pullTags = (comment) => {
  const rtn = {};
  const annotationMatch = /(@\w+) {(((?:\\})|[^}])*)}/g;
  let matches;

  if (comment.startsWith("*")) {
    while ((matches = annotationMatch.exec(comment)) !== null) {
      const tag = matches[1];

      let val = matches[2].replace(/^\s*\*/gm, "");
      val = val.replace(/\\}/g, "}");

      const [leadingWhitespace] = /^\s*/.exec(val);
      val = val.replace(
        new RegExp(`^[ \\t]{${leadingWhitespace.length}}`, "gm"),
        ""
      );
      if (val.endsWith("\n")) val = val.slice(0, -1);
      rtn[tag] = val;
    }
  }
  return rtn;
};

//TODO: Doesn't seem to work if the @tag isn't the first thing in the comment
const pullAllTags = (comments) =>
  comments.map((comment) => pullTags(comment.value)).reduce(safeMergeObjs, {});

const parseParams = (paramString) => {
  const rtn = {};
  const paramMatch = /\[(?:(\w*)(?::\s(.+))?)\]\s*([^\[]*)/g;
  let matches;
  while ((matches = paramMatch.exec(paramString)) !== null) {
    const name = matches[1];
    const type = matches[2];
    const description = matches[3];
    rtn[name] = {
      type,
      description,
    };
  }
  return rtn;
};

const parseRtn = (rtnString) => {
  const matches = /(\[(.*)\])?\s*(.+)/g.exec(rtnString);
  const type = matches[2] || "any";
  const description = matches[3];
  return {
    type: type.trim(),
    description: description.trim(),
  };
};

module.exports = {
  pullTags: pullAllTags,
  parseRtn,
  parseParams,
};
