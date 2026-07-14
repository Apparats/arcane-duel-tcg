const assert = require("assert");
const { createBracket, reportMatchResult, playerMatch } = require("../server/tournaments/bracket");
const { TOURNAMENT_TURN_DURATION_MS, TOURNAMENT_RECONNECT_GRACE_MS } = require("../server/tournaments/rules");

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

const drawBracket = createBracket(dummyPlayers());
assert.strictEqual(playerMatch(drawBracket, "alice").id, "r1m1", "A draw must leave the bracket match ready for a replay.");

console.log("--- TOURNAMENT MATCH FLOW TEST OK ---");
