const assert = require("assert");
const {
  createShieldChallenge,
  recordShieldInput,
  resolveShieldChallenge,
  scaleShieldChallenge,
} = require("../server/campaigns/shieldChallenge");
const { validateDeck } = require("../public/deckRules");
const { getProgress } = require("../public/profileCatalog");

const config = {
  cardId: "campaign2:iron-sentinel",
  arrowCount: 3,
  maxArrowCount: 14,
  intervalMs: 620,
  travelMs: 850,
  damagePerHit: 1,
  arrowIncrease: 1,
  intervalReductionMs: 55,
  minIntervalMs: 440,
  travelReductionMs: 50,
  minTravelMs: 650,
};

assert.deepStrictEqual(
  scaleShieldChallenge(config, 3),
  { ...config, arrowCount: 6, intervalMs: 455, travelMs: 700 },
  "Later shield trials should add arrows and become faster without crossing their limits."
);
assert.deepStrictEqual(
  scaleShieldChallenge(config, 20),
  { ...config, arrowCount: 14, intervalMs: 440, travelMs: 650 },
  "Shield trial difficulty must remain capped."
);

const blockedChallenge = createShieldChallenge(config, { randomInt: () => 0, now: 10_000 });
assert.strictEqual(blockedChallenge.arrows.length, 3, "The configured number of arrows should be created.");
blockedChallenge.arrows.forEach((arrow) => {
  assert(recordShieldInput(blockedChallenge, arrow.direction, arrow.impactAt - 1), "A valid shield input should be accepted.");
});
assert.deepStrictEqual(resolveShieldChallenge(blockedChallenge), { hits: 0, blocked: 3, damage: 0 }, "Matching each direction should block every arrow.");

const hitChallenge = createShieldChallenge(config, { randomInt: () => 0, now: 20_000 });
assert(recordShieldInput(hitChallenge, "right", hitChallenge.arrows[0].impactAt - 1), "A valid direction should be recorded.");
assert.deepStrictEqual(resolveShieldChallenge(hitChallenge), { hits: 3, blocked: 0, damage: 3 }, "Wrong shield directions should deal only server-calculated damage.");
assert.strictEqual(recordShieldInput(hitChallenge, "invalid", hitChallenge.startsAt), false, "Unknown directions must be rejected.");

const encounterOnlyDeck = Array(20).fill("campaign2:iron-sentinel");
assert(
  validateDeck(encounterOnlyDeck, { cardCollection: { "campaign2:iron-sentinel": 20 } }).errors.some((error) => error.includes("cannot be used in player decks")),
  "Encounter-only cards must be rejected from player decks even if they are present in a collection."
);

assert.strictEqual(
  getProgress({ unchainedWins: 1 }, "initiate").achievements.find((achievement) => achievement.id === "unchained-conqueror")?.unlocked,
  true,
  "Defeating The Unchained should unlock its achievement."
);

console.log("--- SHIELD CHALLENGE TEST OK ---");
