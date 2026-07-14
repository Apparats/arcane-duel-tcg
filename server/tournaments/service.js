const tournamentCatalog = require("./catalog");
const { createBracket, reportMatchResult, playerMatch } = require("./bracket");
const { getDB, grantTournamentPrize } = require("../db");

const locks = new Map();

function withTournamentLock(id, task) {
  const previous = locks.get(id) || Promise.resolve();
  const current = previous.catch(() => {}).then(task);
  locks.set(id, current);
  return current.finally(() => {
    if (locks.get(id) === current) locks.delete(id);
  });
}

function configById(id) {
  return tournamentCatalog.find((entry) => entry.enabled !== false && entry.id === id) || null;
}

function tournamentPhase(config, now = Date.now()) {
  const opens = Date.parse(config.registrationOpensAt);
  const closes = Date.parse(config.registrationClosesAt);
  const starts = Date.parse(config.startsAt);
  if (![opens, closes, starts].every(Number.isFinite) || !(opens <= closes && closes <= starts)) {
    throw new Error(`Tournament ${config.id} has invalid dates.`);
  }
  if (now < opens) return "upcoming";
  if (now < closes) return "registration";
  if (now < starts) return "locked";
  return "active";
}

function baseState(config) {
  return { _id: config.id, status: "registration", participants: [], bracket: null, awardedPlaces: [], createdAt: new Date(), updatedAt: new Date() };
}

function participantView(participant) {
  return { userId: String(participant.userId), username: participant.username || "Player", avatarUrl: participant.avatarUrl || null };
}

function publicBracket(state) {
  if (!state.bracket) return null;
  const players = Object.fromEntries((state.participants || []).map((participant) => [String(participant.userId), participantView(participant)]));
  const viewMatch = (match) => !match ? null : {
    id: match.id,
    round: match.round,
    status: match.status,
    players: match.playerIds.map((id) => id ? players[String(id)] || { userId: String(id), username: "Player", avatarUrl: null } : null),
    winnerId: match.winnerId || null,
  };
  return {
    size: state.bracket.size,
    rounds: state.bracket.rounds.map((round) => round.map(viewMatch)),
    thirdPlace: viewMatch(state.bracket.thirdPlace),
    placements: Object.fromEntries(Object.entries(state.bracket.placements).map(([place, userId]) => [place, userId ? players[String(userId)] || null : null])),
  };
}

function publicTournament(config, state, userId) {
  const id = userId == null ? null : String(userId);
  const myMatch = id && state?.bracket ? playerMatch(state.bracket, id) : null;
  return {
    id: config.id,
    name: config.name,
    description: config.description || "",
    registrationOpensAt: config.registrationOpensAt,
    registrationClosesAt: config.registrationClosesAt,
    startsAt: config.startsAt,
    timeZone: config.timeZone || "UTC",
    maxPlayers: config.maxPlayers,
    prizes: config.prizes,
    phase: state?.status === "completed" ? "completed" : state?.status === "cancelled" ? "cancelled" : tournamentPhase(config),
    participantCount: state?.participants?.length || 0,
    registered: Boolean(id && state?.participants?.some((participant) => String(participant.userId) === id)),
    myMatchId: myMatch?.id || null,
    bracket: publicBracket(state),
  };
}

async function getState(config) {
  const collection = getDB().collection("tournaments");
  await collection.updateOne({ _id: config.id }, { $setOnInsert: baseState(config) }, { upsert: true });
  return collection.findOne({ _id: config.id });
}

async function activateIfDue(config) {
  return withTournamentLock(config.id, async () => {
    const state = await getState(config);
    if (state.status !== "registration" || tournamentPhase(config) !== "active") return state;
    if ((state.participants || []).length < 2) {
      await getDB().collection("tournaments").updateOne({ _id: config.id }, { $set: { status: "cancelled", updatedAt: new Date() } });
      return getState(config);
    }
    const bracket = createBracket(state.participants);
    await getDB().collection("tournaments").updateOne(
      { _id: config.id, status: "registration" },
      { $set: { status: "active", bracket, updatedAt: new Date() } }
    );
    return getState(config);
  });
}

async function listTournaments(userId) {
  const output = [];
  for (const config of tournamentCatalog.filter((entry) => entry.enabled !== false)) {
    const state = tournamentPhase(config) === "active" ? await activateIfDue(config) : await getState(config);
    output.push(publicTournament(config, state, userId));
  }
  return output;
}

async function registerForTournament(tournamentId, user) {
  const config = configById(tournamentId);
  if (!config) throw new Error("Tournament not found.");
  return withTournamentLock(config.id, async () => {
    if (tournamentPhase(config) !== "registration") throw new Error("Tournament registration is closed.");
    const state = await getState(config);
    const userId = String(user.id);
    if (state.participants.some((participant) => String(participant.userId) === userId)) return publicTournament(config, state, userId);
    if (state.participants.length >= config.maxPlayers) throw new Error("That tournament is full.");
    const participant = { userId, username: String(user.username || "Player").slice(0, 64), avatarUrl: user.avatarUrl || null, registeredAt: new Date() };
    await getDB().collection("tournaments").updateOne({ _id: config.id, status: "registration" }, { $push: { participants: participant }, $set: { updatedAt: new Date() } });
    return publicTournament(config, await getState(config), userId);
  });
}

async function unregisterFromTournament(tournamentId, userId) {
  const config = configById(tournamentId);
  if (!config) throw new Error("Tournament not found.");
  return withTournamentLock(config.id, async () => {
    if (tournamentPhase(config) !== "registration") throw new Error("Tournament registration is closed.");
    await getDB().collection("tournaments").updateOne(
      { _id: config.id, status: "registration" },
      { $pull: { participants: { userId: String(userId) } }, $set: { updatedAt: new Date() } }
    );
    return publicTournament(config, await getState(config), userId);
  });
}

async function getReadyMatch(tournamentId, userId) {
  const config = configById(tournamentId);
  if (!config) throw new Error("Tournament not found.");
  const state = await activateIfDue(config);
  if (state.status !== "active" || !state.bracket) throw new Error("This tournament is not active.");
  const match = playerMatch(state.bracket, String(userId));
  if (!match) throw new Error("You do not have a tournament match ready.");
  return { config, state, match };
}

async function recordTournamentResult(tournamentId, matchId, winnerId) {
  const config = configById(tournamentId);
  if (!config) throw new Error("Tournament not found.");
  return withTournamentLock(config.id, async () => {
    const state = await getState(config);
    if (state.status !== "active" || !state.bracket) throw new Error("Tournament is not active.");
    reportMatchResult(state.bracket, matchId, String(winnerId));
    const placements = state.bracket.placements;
    const completed = Boolean(placements.first && (!state.bracket.thirdPlace || state.bracket.thirdPlace.status !== "ready"));
    await getDB().collection("tournaments").updateOne(
      { _id: config.id },
      { $set: { bracket: state.bracket, status: completed ? "completed" : "active", updatedAt: new Date() } }
    );
    const prizes = [["first", placements.first], ["second", placements.second], ["third", placements.third]];
    const awards = [];
    for (const [place, userId] of prizes) {
      if (!userId) continue;
      const award = await grantTournamentPrize(userId, { tournamentId: config.id, place, gold: config.prizes[place] });
      awards.push({ place, userId, ...award });
    }
    return { state: await getState(config), awards };
  });
}

module.exports = { listTournaments, registerForTournament, unregisterFromTournament, getReadyMatch, recordTournamentResult, activateIfDue, publicTournament };
