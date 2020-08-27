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

/*console.log(h1('Hello World'));
console.log(h2('Hello World'));
console.log(h3('Hello World'));
console.log(h4('Hello World'));
console.log(h5('Hello World'));

console.log(bullet('Hello World'.split('')))

console.log(code('console.log("Hello World")'))*/

//https://bulldogjob.com/news/449-how-to-write-a-good-readme-for-your-github-project
console.log(`
${h2("Table of Contents")}
${bullet([
  link("General info", "#general-info"),
  link("Technologies", "#technologies"),
  link("Setup", "#setup"),
])}
${h2("General Info")}
This project is simple Lorem ipsum dolor generator.
${h2("Technologies")}
Project is created with:
${bullet([
  "Lorem version: 12.3",
  "Ipsum version: 2.33",
  "Ament library version: 999",
])}
${h2("Setup")}
To run this project, install it locally using npm:

${code(`
$ cd ../lorem
$ npm install
$ npm start
`)}
`);

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
