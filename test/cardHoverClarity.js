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
assert(hoverSection.includes("activeParallaxCard"), "Card hover tracking should keep a sticky active card for fast shell crossings.");
assert(hoverSection.includes("CARD_PARALLAX_STICKY_MARGIN"), "Card hover tracking should keep a tolerance margin around tilt shells.");
assert(hoverSection.includes("cardParallaxHitRect(card)"), "Card hover tracking should use the stable shell hit area for tilt math.");
assert(!clientSource.includes("CARD_PARALLAX_RELEASE_DELAY"), "Card hover should not linger after leaving the card.");
assert(!clientSource.includes("scheduleCardParallaxReset"), "Card hover should reset immediately once the pointer is outside the shell.");
assert(clientSource.includes("if (activeParallaxCard) resetCardParallax(activeParallaxCard);"), "Card hover tracking should clear sticky shell state immediately after the pointer leaves the shell.");
assert(clientSource.includes("resetCardParallax(activeParallaxCard)"), "Card hover tracking should reset the previous active card when another card becomes active.");
assert(cardsCss.includes("backface-visibility: hidden"), "Cards should stabilize backface rendering during hover.");
assert(
  /\.card-cost\s*\{[\s\S]*?transform: translateZ\(16px\);[\s\S]*?backface-visibility: hidden/.test(cardsCss),
  "Card mana cost should stay in front of the art during 3D hover."
);
assert(
  /\.card-stat\s*\{[\s\S]*?transform: translateZ\(18px\);[\s\S]*?backface-visibility: hidden/.test(cardsCss),
  "Card attack, health, and spell value stats should stay in front of the art during 3D hover."
);
assert(
  /\.card-badges\s*\{[\s\S]*?translateX\(-50%\) translateZ\(16px\);[\s\S]*?backface-visibility: hidden/.test(cardsCss),
  "Card keyword badges should stay in front of the art during 3D hover."
);

console.log("--- CARD HOVER CLARITY TEST OK ---");
