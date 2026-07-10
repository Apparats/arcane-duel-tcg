const assert = require("assert");
const { assertUserCanStartMatch, assertUserIsNotAlreadyInRoom, findActiveMatchForUser } = require("../server/matchAccess");

const activeRoom = { game: { winner: null }, userIds: ["player-a", "player-b"] };
const finishedRoom = { game: { winner: 0 }, userIds: ["player-c", "player-d"] };
const rooms = new Map([["active", activeRoom], ["finished", finishedRoom]]);

assert.strictEqual(findActiveMatchForUser(rooms, "player-a"), activeRoom);
assert.strictEqual(findActiveMatchForUser(rooms, "player-c"), null);
assert.throws(() => assertUserCanStartMatch(rooms, "player-b"), /active match/);
assert.doesNotThrow(() => assertUserCanStartMatch(rooms, "player-c"));
assert.throws(() => assertUserIsNotAlreadyInRoom(activeRoom, "player-a"), /own room/);
assert.doesNotThrow(() => assertUserIsNotAlreadyInRoom(activeRoom, "player-c"));

console.log("--- MATCH ACCESS TEST OK ---");
