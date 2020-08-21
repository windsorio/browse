const prettier = require("./lib");
const lang = require("./lib/language");

const input = `
print
  print(a b=true !c d=false e sfd  sefnhn sjenf sejnf sefes=true sdjnfbk    shefbsef  bsebf sefh sehf bes bnf bs efbj eb fs bj )

    print
`;

const data = prettier.formatWithCursor(input, {
  parser: "browse",
  plugins: [lang],
});

console.log(data.formatted);
