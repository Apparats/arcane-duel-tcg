const assert = require("assert");
const fs = require("fs");

const arenaCss = fs.readFileSync("public/css/board-arena.css", "utf8");
const clientSource = fs.readFileSync("public/client.js", "utf8");

assert(
  /\.turn-actions \.turn-action-button\s*\{[\s\S]*?width: var\(--turn-action-size\);[\s\S]*?height: var\(--turn-action-size\);/.test(arenaCss),
  "Turn action buttons should keep the shared square base."
);
assert(
  /@media \(min-width: 721px\) \{[\s\S]*?\.turn-actions \.btn-end-turn\s*\{[\s\S]*?width: calc\(var\(--turn-action-size\) \* 1\.7\);[\s\S]*?min-width: calc\(var\(--turn-action-size\) \* 1\.7\);[\s\S]*?\}/.test(arenaCss),
  "End turn button should become rectangular only on desktop."
);
assert(
  /@media \(max-width: 720px\) \{[\s\S]*?#screen-game \.turn-actions\s*\{[\s\S]*?--turn-action-size: 32px;/.test(arenaCss),
  "Mobile turn actions should retain their compact sizing."
);
assert(arenaCss.includes(".btn-end-turn.has-actions"), "End turn should expose a has-actions color state.");
assert(arenaCss.includes(".btn-end-turn.no-actions"), "End turn should expose a no-actions color state.");
assert(/\.btn-end-turn\.has-actions\s*\{[\s\S]*?background: linear-gradient\(180deg, #ffd95f, #b77916\)/.test(arenaCss), "End turn should be yellow while actions remain.");
assert(/\.btn-end-turn\.no-actions\s*\{[\s\S]*?background: linear-gradient\(180deg, #51d764, #1d7b36\)/.test(arenaCss), "End turn should be green when no actions remain.");
assert(clientSource.includes("function updateEndTurnButtonState(state)"), "Client should centralize end turn button state.");
assert(clientSource.includes('button.classList.remove("action-pending", "has-actions", "no-actions")'), "End turn color classes should reset every render.");
assert(clientSource.includes('button.classList.add(hasActions ? "has-actions" : "no-actions")'), "End turn should switch color by available actions.");
assert(clientSource.includes("function playerHasAvailableActions(state)"), "Client should detect available turn actions.");
assert(clientSource.includes("hasPlayableHandCard(state) || hasReadyAttacker(state)"), "Available actions should include playable cards and ready attackers.");

console.log("--- TURN ACTIONS LAYOUT TEST OK ---");
