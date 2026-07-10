function sameUserId(left, right) {
  return left != null && right != null && String(left) === String(right);
}

function findActiveMatchForUser(rooms, userId) {
  for (const room of rooms.values()) {
    if (!room.game || room.game.winner !== null) continue;
    if (room.userIds?.some((roomUserId) => sameUserId(roomUserId, userId))) return room;
  }
  return null;
}

function assertUserCanStartMatch(rooms, userId) {
  if (!findActiveMatchForUser(rooms, userId)) return;
  const err = new Error("You already have an active match. Finish it or reconnect before starting another one.");
  err.code = "ACTIVE_MATCH_EXISTS";
  throw err;
}

function assertUserIsNotAlreadyInRoom(room, userId) {
  if (!room?.userIds?.some((roomUserId) => sameUserId(roomUserId, userId))) return;
  const err = new Error("You cannot join your own room.");
  err.code = "SELF_MATCH";
  throw err;
}

module.exports = {
  assertUserCanStartMatch,
  assertUserIsNotAlreadyInRoom,
  findActiveMatchForUser,
};
