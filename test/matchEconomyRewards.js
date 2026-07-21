const assert = require("assert");
const { MATCH_REWARDS } = require("../server/db");

assert.strictEqual(MATCH_REWARDS.singleplayer.win, MATCH_REWARDS.multiplayer.win, "Singleplayer wins should pay the same gold as multiplayer wins.");
assert.strictEqual(MATCH_REWARDS.singleplayer.win, 10, "Singleplayer wins should award 10 gold.");

console.log("--- MATCH ECONOMY REWARDS TEST OK ---");
