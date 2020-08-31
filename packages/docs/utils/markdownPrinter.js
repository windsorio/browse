const header = (level, str) => `${new Array(level).fill("#").join("")} ${str}`;
const h1 = (str) => header(1, str);
const h2 = (str) => header(2, str);
const h3 = (str) => header(3, str);
const h4 = (str) => header(4, str);
const h5 = (str) => header(5, str);
const h6 = (str) => header(6, str);

const space = (n) => new Array(n).fill(" ").join("");
const indent = (n) => space(n * 2);

const indentAll = (lines, n) => lines.map((line) => `${space(n)}${line}`);

const bullet = (arr, depth = 0) =>
  arr.map((str) => `${indent(depth)}- ${str}`).join("\n");

const orderedList = (arr, depth = 0) =>
  arr.map((str, i) => `${indent(depth)}${i + 1}. ${str}`).join("\n");

const code = (str, depth = 0) =>
  indent(depth) + ["```", ...str.split("\n"), "```"].join(`\n${indent(depth)}`);

const shortcode = (str) => "`" + str + "`";

const link = (str, link) => `[${str}](${link})`;

const bold = (str) => `**${str}**`;

const italics = (str) => `*${str}*`;

const strikethrough = (str) => `~~${str}~~`;

const quote = (str, depth = 0) =>
  `${indent(depth)}>` + str.split("\n").join(`\n${indent(depth)}>`);

const line = "";

module.exports = {
  header,
  h1,
  h2,
  h3,
  h4,
  h5,
  bullet,
  code,
  shortcode,
  link,
  italics,
  bold,
  strikethrough,
  quote,
  indentAll,
  line,
};
