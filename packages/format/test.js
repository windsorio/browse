const prettier = require("./lib");
const lang = require("./lib/language");

const input = `
print
  print

    print
`;

const data = prettier.formatWithCursor(input, {
  parser: "browse",
  plugins: [lang],
});

console.log(data.formatted);
