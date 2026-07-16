const assert = require("assert");
const { createBracket, reportMatchResult, playerMatch, playerTournamentStatus, resolveByes } = require("../server/tournaments/bracket");

const players = ["a", "b", "c", "d"].map((userId) => ({ userId }));
const bracket = createBracket(players);
assert.strictEqual(bracket.rounds[0].filter((match) => match.status === "ready").length, 2, "Four players should create two semifinals.");
reportMatchResult(bracket, "r1m1", "a");
reportMatchResult(bracket, "r1m2", "c");
assert.strictEqual(playerMatch(bracket, "a").id, "r2m1", "Semifinal winner should advance to the final.");
assert.strictEqual(playerMatch(bracket, "b").id, "third-place", "Semifinal loser should enter the third-place match.");
reportMatchResult(bracket, "third-place", "b");
reportMatchResult(bracket, "r2m1", "c");
assert.deepStrictEqual(bracket.placements, { first: "c", second: "a", third: "b" });

const byeBracket = createBracket(["a", "b", "c"].map((userId) => ({ userId })));
assert.strictEqual(byeBracket.rounds[0][1].status, "bye", "A lone first-round player should receive an automatic bye.");
reportMatchResult(byeBracket, "r1m1", "a");
assert.strictEqual(byeBracket.rounds[1][0].status, "ready", "The bye should advance once its opposing feeder is settled.");

const fivePlayerBracket = createBracket(["a", "b", "c", "d", "e"].map((userId) => ({ userId })));
assert.strictEqual(fivePlayerBracket.rounds[0].filter((match) => match.status === "bye").length, 3, "Five players should receive three automatic first-round byes.");
assert(fivePlayerBracket.rounds[0].every((match) => match.playerIds.some(Boolean)), "A new bracket must not create empty first-round matches.");
assert.strictEqual(playerTournamentStatus(fivePlayerBracket, "c").kind, "bye-waiting", "A player with a bye should be told to wait for their next match.");
reportMatchResult(fivePlayerBracket, "r1m1", "a");
assert.strictEqual(fivePlayerBracket.rounds[1][0].status, "ready", "The first semifinal should unlock after the real opening match finishes.");
assert.strictEqual(fivePlayerBracket.rounds[1][1].status, "ready", "Byes must not block the other semifinal.");
reportMatchResult(fivePlayerBracket, "r2m1", "a");
assert.strictEqual(playerTournamentStatus(fivePlayerBracket, "a").kind, "waiting-next-match", "A winner should be told they are waiting for the next opponent.");

const legacyBracket = createBracket(["a", "b", "c", "d"].map((userId) => ({ userId })));
legacyBracket.rounds[0][1].playerIds = [null, null];
legacyBracket.rounds[0][1].status = "waiting";
resolveByes(legacyBracket);
assert.strictEqual(legacyBracket.rounds[0][1].status, "void", "An old empty match should resolve without blocking the bracket.");
console.log("--- TOURNAMENT BRACKET TEST OK ---");
