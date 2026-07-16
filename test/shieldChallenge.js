const assert = require("assert");
const {
  createShieldChallenge,
  recordShieldInput,
  resolveShieldChallenge,
} = require("../server/campaigns/shieldChallenge");

const config = {
  cardId: "campaign2:iron-sentinel",
  arrowCount: 3,
  intervalMs: 500,
  travelMs: 600,
  damagePerHit: 1,
};

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

console.log("--- SHIELD CHALLENGE TEST OK ---");
