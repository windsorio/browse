const getForbiddenLookupTable = (text, forbidden) => {
  // Forbidden ranges cannot overlap since AST nodes cannot overlap. This makes
  // it easier to work with them. Further, The ranges should also already be
  // sorted because of how ohm semantics works. the format for forbidden is
  //   * [ { startIdx: 123, endIdx: 456 }, ... ]

  // Create an array that has an element for every index
  const rangeLookup = new Array(text.length).fill(0);

  if (!forbidden.length) {
    return rangeLookup;
  }

  for (const range of forbidden) {
    const { startIdx, endIdx } = range;
    rangeLookup[startIdx] = 1;
    rangeLookup[endIdx] = -1;
  }

  // Fill in the pieces in between
  const min = forbidden[0].startIdx,
    max = forbidden.slice(-1)[0].endIdx;

  for (let i = min; i < max + 1; i++) {
    rangeLookup[i] += rangeLookup[i - 1];
  }

  return rangeLookup;
};

module.exports = (text, forbiddenRanges) => {
  const lines = text.split("\n");
  const forbidden = getForbiddenLookupTable(text, forbiddenRanges);
  const comments = [];
  let lineOffset = 0;

  lines.forEach((line) => {
    const regex = /#(?:(?!#).)*$/;
    let lineCopy = (" " + line).slice(1);
    let match, nextMatch;

    while ((nextMatch = regex.exec(lineCopy))) {
      // Check if this is inside a forbidden range and break
      const index = lineOffset + nextMatch.index;
      if (forbidden[index]) break;

      // Else set the match
      match = nextMatch;

      // and then remove the part starting from the matched comment, and try
      // again
      lineCopy = lineCopy.slice(0, match.index);
    }

    if (match) {
      comments.push({
        type: "Comment",
        value: line.slice(match.index + 1), // +1 to remove the '#'
        source: {
          startIdx: lineOffset + match.index,
          endIdx: lineOffset + line.length,
        },
      });
    }

    lineOffset += line.length + 1; // +1 for the `\n` character that we split on
  });

  return comments;
};
