const assert = require("assert");
const { createBracket, reportMatchResult, playerMatch } = require("../server/tournaments/bracket");

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
console.log("--- TOURNAMENT BRACKET TEST OK ---");
