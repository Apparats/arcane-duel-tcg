const assert = require("assert");
const fs = require("fs");

const handCss = fs.readFileSync("public/css/board-hand.css", "utf8");
const clientSource = fs.readFileSync("public/client.js", "utf8");

assert(
  clientSource.includes('el.className = `hand-card ${rarityClass(card)}`'),
  "Hand cards should keep the rarity class in renderHand."
);
assert(
  handCss.includes("#screen-game .hand-card .special-ability-badge") &&
  /#screen-game \.hand-card \.special-ability-badge\s*\{[\s\S]*?bottom: -12px/.test(handCss) &&
  /#screen-game \.hand-card \.special-ability-badge\s*\{[\s\S]*?z-index: 35;[\s\S]*?translateX\(-50%\) translateZ\(24px\)/.test(handCss),
  "Hand special ability badge should sit on the lower edge and remain above card art during 3D hover."
);

for (const rarity of ["common", "rare", "legendary", "mythic", "souvenir"]) {
  const selector = `#screen-game .hand-card.rarity-${rarity}`;
  assert(handCss.includes(selector), `Hand area should restore the ${rarity} rarity border.`);
}

assert(
  /#screen-game \.hand-card\.rarity-rare[\s\S]*?border-color: var\(--mana\)/.test(handCss),
  "Rare hand cards should use the mana border."
);
assert(
  /#screen-game \.hand-card\.rarity-legendary[\s\S]*?border-color: #ffa700/.test(handCss),
  "Legendary hand cards should use the pronounced gold border."
);
assert(
  /#screen-game \.hand-card\.rarity-mythic[\s\S]*?border-color: #df1500/.test(handCss),
  "Mythic hand cards should use the pronounced mythic border."
);
assert(
  /#screen-game \.hand-card\.rarity-souvenir[\s\S]*?border-color: var\(--souvenir\)/.test(handCss),
  "Souvenir hand cards should use the souvenir border."
);

console.log("--- HAND RARITY BORDER TEST OK ---");
