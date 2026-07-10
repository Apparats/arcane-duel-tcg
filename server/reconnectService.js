const DEFAULT_RECONNECT_GRACE_MS = 60_000;

function ensureReconnectSlots(room) {
  if (!Array.isArray(room.reconnects)) room.reconnects = [null, null];
  return room.reconnects;
}

function startReconnectGrace(room, playerIdx, { graceMs = DEFAULT_RECONNECT_GRACE_MS, onExpired }) {
  const reconnects = ensureReconnectSlots(room);
  if (reconnects[playerIdx]) return reconnects[playerIdx];

  const deadline = Date.now() + graceMs;
  const timer = setTimeout(() => onExpired(room, playerIdx), graceMs);
  reconnects[playerIdx] = { deadline, timer };
  return reconnects[playerIdx];
}

function clearReconnectGrace(room, playerIdx) {
  const reconnects = ensureReconnectSlots(room);
  const reconnect = reconnects[playerIdx];
  if (reconnect?.timer) clearTimeout(reconnect.timer);
  reconnects[playerIdx] = null;
}

function clearAllReconnectGraces(room) {
  clearReconnectGrace(room, 0);
  clearReconnectGrace(room, 1);
}

module.exports = {
  DEFAULT_RECONNECT_GRACE_MS,
  startReconnectGrace,
  clearReconnectGrace,
  clearAllReconnectGraces,
};
