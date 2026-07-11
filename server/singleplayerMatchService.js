const { findActiveMatchForUser } = require("./matchAccess");

// A singleplayer match belongs only to its owner and has no reconnection
// contract. Starting another one safely replaces a stale local/NPC room while
// multiplayer matches remain protected by the regular active-match guard.
function discardActiveSingleplayerMatch(rooms, userId, { clearTurnTimer, clearAllReconnectGraces }) {
  const room = findActiveMatchForUser(rooms, userId);
  if (!room || room.mode !== "singleplayer") return false;

  clearTurnTimer(room);
  clearAllReconnectGraces(room);
  const roomCode = room.game.roomCode;
  room.sockets.forEach((socket) => {
    if (!socket || socket.roomCode !== roomCode) return;
    socket.roomCode = null;
    socket.playerIdx = null;
  });
  rooms.delete(roomCode);
  return true;
}

module.exports = { discardActiveSingleplayerMatch };
