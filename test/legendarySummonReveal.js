const assert = require("assert");
const fs = require("fs");

const serverSource = fs.readFileSync("server/index.js", "utf8");
const clientSource = fs.readFileSync("public/client.js", "utf8");

assert(
  serverSource.includes('["legendary", "mythic"].includes(card.rarity)'),
  "Server should broadcast the summon reveal for Legendary and Mythic minions."
);
assert(
  clientSource.includes('!["legendary", "mythic"].includes(card.rarity)'),
  "Client summon reveal should accept Legendary and Mythic minions."
);
assert(
  clientSource.includes('case "mythicSummon"'),
  "Client should keep handling the existing summon reveal event."
);
assert(
  clientSource.includes("showMythicSummonReveal(msg.payload?.cardId)"),
  "Summon reveal event should still use the shared minion reveal animation."
);

console.log("--- LEGENDARY SUMMON REVEAL TEST OK ---");
