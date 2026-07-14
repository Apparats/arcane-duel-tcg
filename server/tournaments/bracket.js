function nextPowerOfTwo(value) {
  let size = 1;
  while (size < value) size *= 2;
  return size;
}

function createMatch(round, slot, playerA = null, playerB = null) {
  return {
    id: `r${round + 1}m${slot + 1}`,
    round,
    slot,
    playerIds: [playerA, playerB],
    status: "waiting",
    winnerId: null,
    loserId: null,
  };
}

function createBracket(players) {
  if (!Array.isArray(players) || players.length < 2) throw new Error("A tournament needs at least two players.");
  const playerIds = players.map((player) => String(player.userId || player.id || player));
  if (new Set(playerIds).size !== playerIds.length) throw new Error("Tournament players must be unique.");

  const size = nextPowerOfTwo(playerIds.length);
  const roundCount = Math.log2(size);
  const rounds = Array.from({ length: roundCount }, (_, round) =>
    Array.from({ length: size / (2 ** (round + 1)) }, (_, slot) => createMatch(round, slot))
  );

  playerIds.forEach((id, index) => {
    rounds[0][Math.floor(index / 2)].playerIds[index % 2] = id;
  });

  const bracket = {
    size,
    playerCount: playerIds.length,
    rounds,
    thirdPlace: playerIds.length >= 4 ? { ...createMatch("third", 0), id: "third-place" } : null,
    placements: { first: null, second: null, third: null },
  };
  resolveByes(bracket);
  return bracket;
}

function findMatch(bracket, matchId) {
  for (const round of bracket.rounds) {
    const match = round.find((entry) => entry.id === matchId);
    if (match) return match;
  }
  return bracket.thirdPlace?.id === matchId ? bracket.thirdPlace : null;
}

function nextMatch(bracket, match) {
  if (typeof match.round !== "number") return null;
  return bracket.rounds[match.round + 1]?.[Math.floor(match.slot / 2)] || null;
}

function advanceWinner(bracket, match) {
  const destination = nextMatch(bracket, match);
  if (!destination) {
    bracket.placements.first = match.winnerId;
    bracket.placements.second = match.loserId;
    return;
  }
  destination.playerIds[match.slot % 2] = match.winnerId;
}

function advanceSemifinalLoser(bracket, match) {
  const isSemifinal = typeof match.round === "number" && match.round === bracket.rounds.length - 2;
  if (!isSemifinal || !match.loserId || !bracket.thirdPlace) return;
  bracket.thirdPlace.playerIds[match.slot] = match.loserId;
}

function completeMatch(bracket, match, winnerId, { bye = false } = {}) {
  const [playerA, playerB] = match.playerIds;
  match.winnerId = winnerId;
  match.loserId = winnerId === playerA ? playerB : playerA;
  match.status = bye ? "bye" : "complete";
  if (match === bracket.thirdPlace) {
    bracket.placements.third = winnerId;
    return;
  }
  advanceWinner(bracket, match);
  if (!bye) advanceSemifinalLoser(bracket, match);
}

function resolveByes(bracket) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const round of bracket.rounds) {
      for (const match of round) {
        if (match.status !== "waiting") continue;
        const active = match.playerIds.filter(Boolean);
        const previousRound = typeof match.round === "number" ? bracket.rounds[match.round - 1] : null;
        const feedersSettled = !previousRound || previousRound.every((entry) => entry.status === "complete" || entry.status === "bye");
        if (active.length === 2) {
          match.status = "ready";
          changed = true;
        } else if (active.length === 1 && feedersSettled) {
          completeMatch(bracket, match, active[0], { bye: true });
          changed = true;
        }
      }
    }
    if (bracket.thirdPlace?.status === "waiting" && bracket.thirdPlace.playerIds.filter(Boolean).length === 2) {
      bracket.thirdPlace.status = "ready";
      changed = true;
    }
  }
  return bracket;
}

function reportMatchResult(bracket, matchId, winnerId) {
  const match = findMatch(bracket, matchId);
  if (!match || match.status !== "ready") throw new Error("That tournament match is not ready.");
  if (!match.playerIds.includes(winnerId)) throw new Error("The reported winner is not in that match.");
  completeMatch(bracket, match, winnerId);
  resolveByes(bracket);
  return bracket;
}

function playerMatch(bracket, playerId) {
  const id = String(playerId);
  for (const round of bracket.rounds) {
    const match = round.find((entry) => entry.status === "ready" && entry.playerIds.includes(id));
    if (match) return match;
  }
  return bracket.thirdPlace?.status === "ready" && bracket.thirdPlace.playerIds.includes(id) ? bracket.thirdPlace : null;
}

module.exports = { createBracket, reportMatchResult, playerMatch, findMatch };
