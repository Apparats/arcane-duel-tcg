const assert = require("assert");
const fs = require("fs");

const clientSource = fs.readFileSync("public/client.js", "utf8");
const boardCss = fs.readFileSync("public/css/board.css", "utf8");
const serverSource = fs.readFileSync("server/index.js", "utf8");
const indexSource = fs.readFileSync("public/index.html", "utf8");

assert(
  serverSource.includes("matchPausedForReconnect: room.reconnects?.some(Boolean) || false"),
  "Server state should tell clients when the match is paused for reconnect."
);
assert(
  /function markMultiplayerDisconnected\(room, playerIdx\)[\s\S]*?pauseTurnTimerForReconnect\(room\)[\s\S]*?broadcastState\(room\)/.test(serverSource),
  "Server should broadcast a paused state as soon as a multiplayer player disconnects."
);
assert(
  /function resumeMultiplayerMatch\(ws\)[\s\S]*?clearReconnectGrace\(match, playerIdx\)[\s\S]*?broadcastState\(match\)/.test(serverSource),
  "Server should resume the turn timer before sending state after reconnect."
);
assert(
  clientSource.includes("function showSelfReconnectStatus()"),
  "Client should show persistent reconnect instructions for the disconnected player."
);
assert(
  clientSource.includes("Keep this screen open."),
  "Reconnect status should tell players how to recover."
);
assert(
  clientSource.includes("scheduleMultiplayerReconnect(RECONNECT_RETRY_MS)"),
  "Client should retry reconnect attempts until the grace window expires."
);
assert(
  clientSource.includes('timer.textContent = "Paused - reconnecting"'),
  "Turn timer should visibly pause during reconnect grace."
);
assert(
  boardCss.includes("#screen-game.match-reconnecting .board-frame"),
  "Board should visually enter a paused reconnect state."
);
assert(
  indexSource.includes("css/board.css?v=1.6.9-v1") && indexSource.includes("client.js?v=1.6.9-v9"),
  "Reconnect UI assets should be cache-busted."
);

console.log("--- RECONNECT UI TEST OK ---");
