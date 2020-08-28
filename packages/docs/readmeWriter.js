const header = (level, str) => `${new Array(level).fill("#").join("")} ${str}`;
const h1 = (str) => header(1, str);
const h2 = (str) => header(2, str);
const h3 = (str) => header(3, str);
const h4 = (str) => header(4, str);
const h5 = (str) => header(5, str);
const h6 = (str) => header(6, str);

const space = (n) => new Array(n).fill(" ").join("");

const indentAll = (lines, n) => lines.map((line) => `${space(n)}${line}`);

const bullet = (arr, indent = 0) =>
  arr.map((str) => `${space(indent * 2)}* ${str}`).join("\n");

const orderedList = (arr, indent = 0) =>
  arr.map((str, i) => `${space(indent * 2)}${i + 1}. ${str}`).join("\n");

const code = (str) => "```\n" + str + "\n```";

const shortcode = (str) => "`" + str + "`";

const link = (str, link) => `[${str}](${link})`;

const bold = (str) => `**${str}**`;

const italics = (str) => `*${str}*`;

const strikethrough = (str) => `~~${str}~~`;

const quote = (str) => `> ${str}`;

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
};
