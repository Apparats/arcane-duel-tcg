const assert = require("assert");
const { MATCH_REWARDS, RANKED_MATCH_REWARDS } = require("../server/db");

assert.strictEqual(MATCH_REWARDS.singleplayer.win, MATCH_REWARDS.multiplayer.win, "Singleplayer wins should pay the same gold as multiplayer wins.");
assert.strictEqual(MATCH_REWARDS.singleplayer.win, 10, "Singleplayer wins should award 10 gold.");
assert.strictEqual(MATCH_REWARDS.singleplayer.loss, 5, "Singleplayer losses should award 5 gold.");
assert.strictEqual(MATCH_REWARDS.singleplayer.loss, MATCH_REWARDS.multiplayer.loss, "Singleplayer losses should pay the same gold as multiplayer losses.");
assert.deepStrictEqual(RANKED_MATCH_REWARDS, { win: 20, loss: 10 }, "Ranked matches should count as 20/10 gold for daily multiplayer gold.");

const dbSource = require("fs").readFileSync("server/db.js", "utf8");
assert(
  dbSource.includes('const rewardTable = ranked && mode === "multiplayer" ? RANKED_MATCH_REWARDS : MATCH_REWARDS[mode];') &&
    dbSource.includes('const dailyField = `economy.dailyRewards.${day}.${mode}`;'),
  "Ranked rewards should use the multiplayer daily bucket with the ranked reward table."
);
assert(
  dbSource.includes('const baseReward = surrendered || result === "draw" ? 0 : rewardTable[result];'),
  "Surrenders should still grant no base gold reward."
);

console.log("--- MATCH ECONOMY REWARDS TEST OK ---");
