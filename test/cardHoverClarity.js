const assert = require("assert");
const fs = require("fs");

const clientSource = fs.readFileSync("public/client.js", "utf8");
const cardsCss = fs.readFileSync("public/css/cards.css", "utf8");

const hoverSectionMatch = clientSource.match(
  /\/\/ ---------------- 3D CARD PARALLAX EFFECT ----------------[\s\S]*?document\.addEventListener\("mouseout"/
);

assert(hoverSectionMatch, "Client should keep the card 3D parallax section.");

const hoverSection = hoverSectionMatch[0];

assert(hoverSection.includes("rotateX("), "Card hover tracking should keep 3D X-axis tilt.");
assert(hoverSection.includes("rotateY("), "Card hover tracking should keep 3D Y-axis tilt.");
assert(hoverSection.includes("translateZ(4px)"), "Card hover tracking should keep the existing inner art depth.");
assert(hoverSection.includes("--shine-x"), "Card hover tracking should keep cursor-following shine X.");
assert(hoverSection.includes("--shine-y"), "Card hover tracking should keep cursor-following shine Y.");
assert(hoverSection.includes("--foil-angle"), "Card hover tracking should keep cursor-following foil angle.");
assert(cardsCss.includes("backface-visibility: hidden"), "Cards should stabilize backface rendering during hover.");

console.log("--- CARD HOVER CLARITY TEST OK ---");
