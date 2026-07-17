const assert = require("assert");
const { TournamentMatchStartQueue } = require("../server/tournaments/matchStartQueue");

async function main() {
  const queue = new TournamentMatchStartQueue({ concurrency: 2 });
  let running = 0;
  let peakRunning = 0;
  const started = [];
  const createTask = (id) => async () => {
    running += 1;
    peakRunning = Math.max(peakRunning, running);
    started.push(id);
    await new Promise((resolve) => setTimeout(resolve, 10));
    running -= 1;
  };

  const jobs = ["a", "b", "c", "d"].map((id) => queue.enqueue(id, createTask(id)).promise);
  assert.strictEqual(queue.enqueue("a", createTask("duplicate")), null, "A tournament match must not be queued twice.");
  await Promise.all(jobs);
  assert(peakRunning <= 2, "Tournament starts must respect the configured concurrency limit.");
  assert.deepStrictEqual(started.sort(), ["a", "b", "c", "d"], "Every unique queued match should start exactly once.");

  const recoveryQueue = new TournamentMatchStartQueue({ concurrency: 1 });
  const failedStart = recoveryQueue.enqueue("bad-match", async () => {
    throw new Error("Deck validation failed.");
  }).promise;
  let continuedAfterFailure = false;
  const recoveredStart = recoveryQueue.enqueue("next-match", async () => {
    continuedAfterFailure = true;
  }).promise;
  await assert.rejects(failedStart, /Deck validation failed/);
  await recoveredStart;
  assert(continuedAfterFailure, "A failed tournament start must release the queue for the next match.");
  console.log("--- TOURNAMENT START QUEUE TEST OK ---");
}

main().catch((err) => {
  console.error("TOURNAMENT START QUEUE TEST FAILED:", err);
  process.exit(1);
});
