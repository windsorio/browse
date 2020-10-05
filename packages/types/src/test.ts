import * as fs from "fs";
const parser = require("@browselang/parser");
import astTransformer from "./astTransformer";

console.log(__dirname);
const code = fs.readFileSync(
  "/home/andrew/browse/packages/types/src/test.browse"
);

const tree = parser.parse(code.toString());

console.log("Tree", JSON.stringify(tree));
console.log("AST Transformer", JSON.stringify(astTransformer(tree)));
