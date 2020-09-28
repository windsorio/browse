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
    rtn[tag] = val.trim();
  }
  return rtn;
};

//TODO: Doesn't seem to work if the @tag isn't the first thing in the comment
const pullAllTags = (comments) =>
  comments.map((comment) => pullTags(comment.value)).reduce(safeMergeObjs, {});

const parseParams = (paramString) => {
  const rtn = {};
  const paramMatch = /\[(?:(\w*)(?::\s(.+))?)\]\s*:?\s*([^\[]*)/g;
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
  const matches = /(\[(.*)\])?\s*:?\s*(.+)/g.exec(rtnString);
  const type = matches[2] || "any";
  const description = matches[3];
  return {
    type: type.trim(),
    description: description.trim(),
  };
};

/*
 * Grabs the text that's not part of the autodoc format
 */
const getPlaintext = (comment) => {
  const annotationMatch = /(@\w+) {(((?:\\})|[^}])*)}/g;

  let lastMatchedIndex = 0;
  const nonMatched = [];
  while ((matches = annotationMatch.exec(comment)) !== null) {
    nonMatched.push(comment.slice(lastMatchedIndex, matches.index));
    lastMatchedIndex = matches.index + matches[0].length;
  }
  nonMatched.push(comment.slice(lastMatchedIndex));

  return nonMatched;
};

/*
 * Process a single annotated variable
 */
const processVar = (variableComments) => {
  const rtn = {};

  const tags = pullAllTags(variableComments);
  /* Parse the help tag */

  if (tags["@help"] === undefined && tags["@desc"] === undefined) {
    //If the help and desc tags have no data we grab all of the text
    rtn.help = variableComments
      .map((comment) => getPlaintext(comment.value))
      .join("\n");
  } else {
    //else we just extract data from @help tags
    rtn.help = tags["@help"] || tags["@desc"];
  }

  /* Parse the desc tag */
  if (tags["@desc"] === undefined && tags["@help"] === undefined) {
    //If the help and desc tags have no data we grab all of the text
    rtn.help = variableComments
      .map((comment) => getPlaintext(comment.value))
      .join("\n");
  } else {
    //else we just extract data from @help tags
    rtn.help = tags["@desc"] || tags["@help"];
  }

  if (tags["@type"] !== undefined) {
    rtn.type = tags["@type"];
  }

  /* Parse the example tag */
  if (tags["@example"] !== undefined) {
    rtn.example = tags["@example"];
  }

  /* Parse the example tag */
  if (tags["@notes"] !== undefined) {
    rtn.notes = tags["@notes"];
  }
  return rtn;
};

/*
 * Process a single annotated rule
 */
const processRule = (ruleComments) => {
  const rtn = {};

  const tags = pullAllTags(ruleComments);
  /* Parse the help tag */

  if (tags["@help"] === undefined && tags["@desc"] === undefined) {
    //If the help and desc tags have no data we grab all of the text
    rtn.help = ruleComments
      .map((comment) => getPlaintext(comment.value))
      .join("\n");
  } else {
    //else we just extract data from @help tags
    rtn.help = tags["@help"] || tags["@desc"];
  }

  /* Parse the desc tag */
  if (tags["@desc"] === undefined && tags["@help"] === undefined) {
    //If the help and desc tags have no data we grab all of the text
    rtn.help = ruleComments
      .map((comment) => getPlaintext(comment.value))
      .join("\n");
  } else {
    //else we just extract data from @help tags
    rtn.help = tags["@desc"] || tags["@help"];
  }

  /* Parse the params tag */
  if (tags["@params"] !== undefined) {
    rtn.params = parseParams(tags["@params"]);
  }

  /* Parse the returns tag */
  if (tags["@return"] !== undefined) {
    rtn.rtn = parseRtn(tags["@return"]);
  }

  /* Parse the example tag */
  if (tags["@example"] !== undefined) {
    rtn.example = tags["@example"];
  }

  /* Parse the example tag */
  if (tags["@notes"] !== undefined) {
    rtn.notes = tags["@notes"];
  }
  return rtn;
};

module.exports = {
  pullTags: pullAllTags,
  parseRtn,
  parseParams,
  processRule,
  processVar,
};
