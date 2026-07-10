const assert = require("assert");
const { clearTurnTimer, ensureTurnTimer, turnKey } = require("../server/turnTimerService");

async function run() {
  const room = { game: { turnNumber: 1, turn: 0, winner: null }, turnTimer: null };
  let expirations = 0;
  const first = ensureTurnTimer(room, () => { expirations += 1; }, { durationMs: 10 });
  assert.strictEqual(first.key, "1:0");
  assert.strictEqual(ensureTurnTimer(room, () => { expirations += 1; }, { durationMs: 10 }), first);
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.strictEqual(expirations, 1);

  room.game.turn = 1;
  assert.strictEqual(turnKey(room.game), "1:1");
  ensureTurnTimer(room, () => { expirations += 1; }, { durationMs: 20 });
  clearTurnTimer(room);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.strictEqual(expirations, 1);
  console.log("--- TURN TIMER TEST OK ---");
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
