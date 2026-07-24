const assert = require("assert");
const fs = require("fs");

const indexHtml = fs.readFileSync("public/index.html", "utf8");
const clientSource = fs.readFileSync("public/client.js", "utf8");

assert(
  /<button id="btnMulliganReplace"[^>]*>Ready<\/button>/.test(indexHtml),
  "Mulligan action button should start as Ready."
);
assert(
  clientSource.includes("function updateMulliganReplaceButtonLabel"),
  "Mulligan should use a shared button label updater."
);
assert(
  clientSource.includes('mulliganSelectedIndexes.size > 0 ? "Replace" : "Ready"'),
  "Mulligan button should say Replace only after selecting cards."
);
assert(
  clientSource.includes("updateMulliganReplaceButtonLabel(false)"),
  "Mulligan selection changes should refresh the button label."
);

console.log("--- MULLIGAN READY BUTTON TEST OK ---");
