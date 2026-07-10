const { startReconnectGrace, clearReconnectGrace } = require("../server/reconnectService");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const room = {};
  let expired = false;
  const reconnect = startReconnectGrace(room, 0, {
    graceMs: 1_000,
    onExpired: () => {
      expired = true;
    },
  });

  assert(reconnect.deadline > Date.now(), "Reconnect grace needs a server deadline.");
  assert(room.reconnects[0] === reconnect, "Reconnect grace should be stored on the room.");
  clearReconnectGrace(room, 0);
  assert(room.reconnects[0] === null, "Clearing reconnect grace should release the room slot.");
  assert(!expired, "Clearing reconnect grace must not expire the match.");
  console.log("--- RECONNECT SERVICE TEST OK ---");
}

main();
