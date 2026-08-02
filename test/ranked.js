const assert = require("assert");
const { getRank, rankedRewardTiers, rankedSeason, rankedSeasonResetRating, rankedWindow } = require("../server/ranked");

assert.strictEqual(getRank(0).name, "Sand");
assert.strictEqual(getRank(400).name, "Bronze");
assert.strictEqual(getRank(900).name, "Gold");
assert.strictEqual(getRank(1500).name, "Diamond");
assert.strictEqual(getRank(2200).name, "Master");
assert.deepStrictEqual(rankedRewardTiers().map((rank) => [rank.name, rank.rewardGold]), [
  ["Sand", 0],
  ["Bronze", 150],
  ["Gold", 300],
  ["Diamond", 600],
  ["Master", 1200],
]);
assert.strictEqual(rankedSeasonResetRating(0), 0);
assert.strictEqual(rankedSeasonResetRating(450), 0);
assert.strictEqual(rankedSeasonResetRating(950), 0);
assert.strictEqual(rankedSeasonResetRating(1600), 400);
assert.strictEqual(rankedSeasonResetRating(2400), 900);
assert.strictEqual(rankedSeason(new Date("2026-08-12T10:00:00Z")).endsAt.toISOString(), "2026-09-01T00:00:00.000Z");

const fridayBefore = rankedWindow(new Date("2026-07-31T16:59:00Z"));
assert.strictEqual(fridayBefore.open, false);
assert.strictEqual(fridayBefore.startsAt.toISOString(), "2026-07-31T17:00:00.000Z");
const fridayOpen = rankedWindow(new Date("2026-07-31T17:30:00Z"));
assert.strictEqual(fridayOpen.open, true);
assert.strictEqual(fridayOpen.startsAt.toISOString(), "2026-07-31T17:00:00.000Z");
assert.strictEqual(fridayOpen.endsAt.toISOString(), "2026-07-31T18:00:00.000Z");
const saturdayOpen = rankedWindow(new Date("2026-08-01T18:30:00Z"));
assert.strictEqual(saturdayOpen.open, true);
assert.strictEqual(saturdayOpen.endsAt.toISOString(), "2026-08-01T19:00:00.000Z");
const sundayOpen = rankedWindow(new Date("2026-08-02T20:30:00Z"));
assert.strictEqual(sundayOpen.open, true);
assert.strictEqual(sundayOpen.endsAt.toISOString(), "2026-08-02T21:00:00.000Z");
const sundayClosed = rankedWindow(new Date("2026-08-02T21:01:00Z"));
assert.strictEqual(sundayClosed.startsAt.toISOString(), "2026-08-07T17:00:00.000Z");
console.log("--- RANKED TEST OK ---");

