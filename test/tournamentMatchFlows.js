const assert = require("assert");
const { createBracket, reportMatchResult, playerMatch, recordMatchArrival, resolveReadyNoShows } = require("../server/tournaments/bracket");
const { TOURNAMENT_TURN_DURATION_MS, TOURNAMENT_RECONNECT_GRACE_MS, TOURNAMENT_READY_GRACE_MS } = require("../server/tournaments/rules");

function dummyPlayers() {
  return ["alice", "bruno", "cora", "david"].map((userId) => ({ userId }));
}

// A surrender and an expired reconnect are both authoritative wins for the
// remaining player. A draw is deliberately not reported, so the match stays ready.
const surrenderBracket = createBracket(dummyPlayers());
reportMatchResult(surrenderBracket, "r1m1", "bruno");
assert.strictEqual(playerMatch(surrenderBracket, "bruno"), null, "A semifinal winner waits for the other semifinal.");
assert.strictEqual(surrenderBracket.rounds[0][0].loserId, "alice", "Surrendered player must be eliminated.");

const disconnectBracket = createBracket(dummyPlayers());
reportMatchResult(disconnectBracket, "r1m2", "cora");
assert.strictEqual(disconnectBracket.rounds[0][1].loserId, "david", "A disconnected player who times out must be eliminated.");
assert.strictEqual(TOURNAMENT_TURN_DURATION_MS, 30_000, "Tournament turns must stay short.");
assert.strictEqual(TOURNAMENT_RECONNECT_GRACE_MS, 30_000, "Tournament reconnect grace must stay short.");
assert.strictEqual(TOURNAMENT_READY_GRACE_MS, 180_000, "Tournament no-shows must not leave opponents waiting forever.");

const waitingNoShowBracket = createBracket(dummyPlayers());
recordMatchArrival(waitingNoShowBracket, "r1m1", "alice");
waitingNoShowBracket.rounds[0][0].noShowDeadline = new Date(Date.now() - 1);
resolveReadyNoShows(waitingNoShowBracket);
assert.strictEqual(waitingNoShowBracket.rounds[0][0].winnerId, "alice", "A waiting player should advance when their opponent never enters.");
assert.strictEqual(waitingNoShowBracket.rounds[0][0].loserId, "bruno", "The absent opponent should be eliminated.");

const doubleNoShowBracket = createBracket(dummyPlayers());
doubleNoShowBracket.rounds[0][0].noShowDeadline = new Date(Date.now() - 1);
resolveReadyNoShows(doubleNoShowBracket);
assert.strictEqual(doubleNoShowBracket.rounds[0][0].status, "void", "A match where neither player enters should not block the bracket.");
assert.strictEqual(doubleNoShowBracket.rounds[0][0].winnerId, null, "A double no-show must not invent a winner.");

const drawBracket = createBracket(dummyPlayers());
assert.strictEqual(playerMatch(drawBracket, "alice").id, "r1m1", "A draw must leave the bracket match ready for a replay.");

console.log("--- TOURNAMENT MATCH FLOW TEST OK ---");
