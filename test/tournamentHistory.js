const assert = require("assert");
const { createBracket, reportMatchResult, resolveReadyNoShows } = require("../server/tournaments/bracket");
const { isTournamentComplete, publicTournament, snapshotTournamentConfig } = require("../server/tournaments/service");

const config = {
  id: "archive-test",
  name: "Archive Test",
  description: "A completed tournament remains readable.",
  registrationOpensAt: "2026-01-01T00:00:00.000Z",
  registrationClosesAt: "2026-01-02T00:00:00.000Z",
  startsAt: "2026-01-03T00:00:00.000Z",
  timeZone: "UTC",
  maxPlayers: 4,
  prizes: { first: 1000, second: 500, third: 250 },
};
const participants = ["a", "b", "c", "d"].map((userId) => ({ userId, username: `Player ${userId}` }));
const bracket = createBracket(participants);
reportMatchResult(bracket, "r1m1", "a");
reportMatchResult(bracket, "r1m2", "c");
reportMatchResult(bracket, "third-place", "b");
reportMatchResult(bracket, "r2m1", "c");

const view = publicTournament(config, {
  status: "completed",
  participants,
  bracket,
  configSnapshot: snapshotTournamentConfig(config),
  finishedAt: new Date("2026-01-03T12:00:00.000Z"),
}, "a");

assert.strictEqual(view.phase, "completed", "Finished tournaments must retain their completed phase.");
assert.strictEqual(view.archived, true, "Finished tournaments must be marked as history.");
assert.strictEqual(view.bracket.rounds[0][0].winnerId, "a", "Bracket history must preserve the advancing player.");
assert.strictEqual(view.bracket.rounds[0][0].loserId, "b", "Bracket history must preserve the eliminated player.");
assert.strictEqual(view.bracket.placements.first.username, "Player c", "The final podium must remain public after completion.");
assert.strictEqual(view.prizes.first, 1000, "Archived tournaments must retain their original prize table.");

const parallelFinalBracket = createBracket(participants);
reportMatchResult(parallelFinalBracket, "r1m1", "a");
reportMatchResult(parallelFinalBracket, "r1m2", "c");
reportMatchResult(parallelFinalBracket, "r2m1", "c");
assert.strictEqual(isTournamentComplete(parallelFinalBracket), false, "A playable third-place match must finish before the tournament archives.");
parallelFinalBracket.thirdPlace.status = "waiting";
assert.strictEqual(isTournamentComplete(parallelFinalBracket), false, "A malformed waiting third-place match must not prematurely complete the tournament.");
parallelFinalBracket.thirdPlace.status = "ready";
reportMatchResult(parallelFinalBracket, "third-place", "b");
assert.strictEqual(isTournamentComplete(parallelFinalBracket), true, "The tournament should complete once the final and third-place result are settled.");

const abandonedBracket = createBracket(["a", "b"].map((userId) => ({ userId })));
abandonedBracket.rounds[0][0].noShowDeadline = new Date(Date.now() - 1);
resolveReadyNoShows(abandonedBracket);
assert.strictEqual(abandonedBracket.rounds[0][0].status, "void", "A fully abandoned final should become a no contest.");
assert.strictEqual(isTournamentComplete(abandonedBracket), true, "A fully abandoned tournament should still reach a terminal state.");

for (let count = 2; count <= 32; count += 1) {
  const bracketUnderTest = createBracket(Array.from({ length: count }, (_, index) => ({ userId: `p${index}` })));
  let remainingResults = 128;
  while (!isTournamentComplete(bracketUnderTest) && remainingResults-- > 0) {
    const nextMatch = [...bracketUnderTest.rounds.flat(), bracketUnderTest.thirdPlace]
      .find((match) => match?.status === "ready");
    assert(nextMatch, `${count}-player brackets must always expose a next playable match.`);
    reportMatchResult(bracketUnderTest, nextMatch.id, nextMatch.playerIds.find(Boolean));
  }
  assert(isTournamentComplete(bracketUnderTest), `${count}-player brackets must reach a terminal state.`);
}

console.log("--- TOURNAMENT HISTORY TEST OK ---");
