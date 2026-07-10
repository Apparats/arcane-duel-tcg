const assert = require("assert");
const { cleanupExpiredWsTickets, consumeWsTicket, issueWsTicket } = require("../server/wsTicketService");

const user = { id: "player-a", username: "Player A" };
const first = issueWsTicket(user);
assert.match(first, /^[A-Za-z0-9_-]{32,128}$/);
assert.deepStrictEqual(consumeWsTicket(first), user);
assert.strictEqual(consumeWsTicket(first), null);

const replaced = issueWsTicket(user);
const current = issueWsTicket(user);
assert.strictEqual(consumeWsTicket(replaced), null);
assert.deepStrictEqual(consumeWsTicket(current), user);
cleanupExpiredWsTickets();

console.log("--- WS TICKET TEST OK ---");
