const DEFAULT_TURN_DURATION_MS = 40_000;

function turnKey(game) {
  return `${game.turnNumber}:${game.turn}`;
}

function clearTurnTimer(room) {
  if (room?.turnTimer?.timer) clearTimeout(room.turnTimer.timer);
  if (room) room.turnTimer = null;
}

function ensureTurnTimer(room, onExpired, { durationMs = DEFAULT_TURN_DURATION_MS } = {}) {
  if (!room?.game || room.game.winner !== null) {
    clearTurnTimer(room);
    return null;
  }

  const key = turnKey(room.game);
  if (room.turnTimer?.key === key) return room.turnTimer;

  clearTurnTimer(room);
  const deadline = Date.now() + durationMs;
  const timer = setTimeout(() => {
    if (room.turnTimer?.key !== key) return;
    room.turnTimer = null;
    Promise.resolve(onExpired(room, key)).catch((err) => {
      console.error("Turn timeout handler failed:", err.message);
    });
  }, durationMs);
  room.turnTimer = { key, deadline, timer, durationMs };
  return room.turnTimer;
}

module.exports = {
  DEFAULT_TURN_DURATION_MS,
  clearTurnTimer,
  ensureTurnTimer,
  turnKey,
};
