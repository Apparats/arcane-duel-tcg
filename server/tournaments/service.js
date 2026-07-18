const tournamentCatalog = require("./catalog");
const { createBracket, reportMatchResult, playerMatch, playerTournamentStatus, resolveByes } = require("./bracket");
const { getDB, grantTournamentPrize } = require("../db");
const { secureRandomInt } = require("../random");

const locks = new Map();

function withTournamentLock(id, task) {
  const previous = locks.get(id) || Promise.resolve();
  const current = previous.catch(() => {}).then(task);
  locks.set(id, current);
  return current.finally(() => {
    if (locks.get(id) === current) locks.delete(id);
  });
}

function scheduledConfigById(id) {
  return tournamentCatalog.find((entry) => entry.id === id) || null;
}

function configById(id) {
  const config = scheduledConfigById(id);
  return config?.enabled !== false ? config : null;
}

function snapshotTournamentConfig(config) {
  return {
    id: String(config.id),
    name: String(config.name || config.id),
    description: String(config.description || ""),
    registrationOpensAt: config.registrationOpensAt,
    registrationClosesAt: config.registrationClosesAt,
    startsAt: config.startsAt,
    timeZone: config.timeZone || "UTC",
    maxPlayers: Number(config.maxPlayers) || 0,
    prizes: {
      first: Number(config.prizes?.first) || 0,
      second: Number(config.prizes?.second) || 0,
      third: Number(config.prizes?.third) || 0,
    },
  };
}

function isArchivedState(state) {
  return state?.status === "completed" || state?.status === "cancelled";
}

function stateConfig(state, fallbackConfig) {
  return state?.configSnapshot || snapshotTournamentConfig(fallbackConfig);
}

async function resolveTournamentConfig(id) {
  const scheduled = scheduledConfigById(id);
  if (scheduled) return scheduled;
  const state = await getDB().collection("tournaments").findOne(
    { _id: id },
    { projection: { configSnapshot: 1 } }
  );
  return state?.configSnapshot || null;
}

function isTournamentComplete(bracket) {
  if (!bracket?.placements?.first) return false;
  const thirdPlace = bracket.thirdPlace;
  if (!thirdPlace) return true;
  const thirdPlaceEntrants = thirdPlace.playerIds.filter(Boolean);
  if (thirdPlaceEntrants.length < 2) return true;
  return ["complete", "bye", "void"].includes(thirdPlace.status);
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
    loserId: match.loserId || null,
  };
  return {
    size: state.bracket.size,
    rounds: state.bracket.rounds.map((round) => round.map(viewMatch)),
    thirdPlace: viewMatch(state.bracket.thirdPlace),
    placements: Object.fromEntries(Object.entries(state.bracket.placements).map(([place, userId]) => [place, userId ? players[String(userId)] || null : null])),
  };
}

function publicTournament(config, state, userId) {
  const tournament = stateConfig(state, config);
  const id = userId == null ? null : String(userId);
  const myMatch = id && state?.bracket ? playerMatch(state.bracket, id) : null;
  const myStatus = id && state?.bracket ? playerTournamentStatus(state.bracket, id) : null;
  return {
    id: tournament.id,
    name: tournament.name,
    description: tournament.description,
    registrationOpensAt: tournament.registrationOpensAt,
    registrationClosesAt: tournament.registrationClosesAt,
    startsAt: tournament.startsAt,
    timeZone: tournament.timeZone,
    maxPlayers: tournament.maxPlayers,
    prizes: tournament.prizes,
    phase: isArchivedState(state) ? state.status : tournamentPhase(tournament),
    participantCount: state?.participants?.length || 0,
    registered: Boolean(id && state?.participants?.some((participant) => String(participant.userId) === id)),
    myMatchId: myMatch?.id || null,
    myStatus,
    bracket: publicBracket(state),
    finishedAt: state?.finishedAt || null,
    archived: isArchivedState(state),
  };
}

async function getState(config) {
  const collection = getDB().collection("tournaments");
  await collection.updateOne({ _id: config.id }, { $setOnInsert: baseState(config) }, { upsert: true });
  return collection.findOne({ _id: config.id });
}

async function preserveArchivedConfig(config, state) {
  if (!isArchivedState(state) || state?.configSnapshot) return state;
  const configSnapshot = snapshotTournamentConfig(config);
  await getDB().collection("tournaments").updateOne(
    { _id: config.id, $or: [{ configSnapshot: { $exists: false } }, { configSnapshot: null }] },
    { $set: { configSnapshot } }
  );
  return { ...state, configSnapshot };
}

async function activateIfDue(config) {
  return withTournamentLock(config.id, async () => {
    const state = await getState(config);
    const phase = tournamentPhase(config);
    if (state.status === "registration" && phase === "active") {
      if ((state.participants || []).length < 2) {
        const finishedAt = new Date();
        await getDB().collection("tournaments").updateOne(
          { _id: config.id },
          { $set: { status: "cancelled", configSnapshot: snapshotTournamentConfig(config), finishedAt, updatedAt: finishedAt } }
        );
        return getState(config);
      }
      const bracket = createBracket(state.participants, { randomInt: secureRandomInt });
      const startedAt = new Date();
      await getDB().collection("tournaments").updateOne(
        { _id: config.id, status: "registration" },
        { $set: { status: "active", bracket, configSnapshot: snapshotTournamentConfig(config), startedAt, updatedAt: startedAt } }
      );
      return getState(config);
    }

    if (state.status === "active" && state.bracket) {
      const before = JSON.stringify(state.bracket);
      resolveByes(state.bracket);
      if (JSON.stringify(state.bracket) !== before) {
        await getDB().collection("tournaments").updateOne(
          { _id: config.id, status: "active" },
          { $set: { bracket: state.bracket, updatedAt: new Date() } }
        );
      }
    }
    return state;
  });
}

async function listTournaments(userId) {
  const output = [];
  const currentConfigs = tournamentCatalog.filter((entry) => entry.enabled !== false);
  const currentIds = new Set(currentConfigs.map((config) => config.id));
  for (const config of currentConfigs) {
    let state = tournamentPhase(config) === "active" ? await activateIfDue(config) : await getState(config);
    state = await preserveArchivedConfig(config, state);
    output.push(publicTournament(config, state, userId));
  }
  const persistedStates = await getDB().collection("tournaments")
    .find({ status: { $in: ["active", "completed", "cancelled"] } })
    .sort({ finishedAt: -1, updatedAt: -1 })
    .toArray();
  const persistedTournaments = persistedStates
    .filter((state) => !currentIds.has(String(state._id)) && state.configSnapshot)
    .map((state) => publicTournament(state.configSnapshot, state, userId));
  return [...output, ...persistedTournaments];
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
  const config = await resolveTournamentConfig(tournamentId);
  if (!config) throw new Error("Tournament not found.");
  const state = await activateIfDue(config);
  if (state.status !== "active" || !state.bracket) throw new Error("This tournament is not active.");
  const match = playerMatch(state.bracket, String(userId));
  if (!match) throw new Error("You do not have a tournament match ready.");
  return { config: stateConfig(state, config), state, match };
}

async function recordTournamentResult(tournamentId, matchId, winnerId) {
  const config = await resolveTournamentConfig(tournamentId);
  if (!config) throw new Error("Tournament not found.");
  return withTournamentLock(config.id, async () => {
    const state = await getState(config);
    if (state.status !== "active" || !state.bracket) throw new Error("Tournament is not active.");
    reportMatchResult(state.bracket, matchId, String(winnerId));
    const placements = state.bracket.placements;
    const completed = isTournamentComplete(state.bracket);
    const tournament = stateConfig(state, config);
    const update = {
      bracket: state.bracket,
      status: completed ? "completed" : "active",
      configSnapshot: tournament,
      updatedAt: new Date(),
    };
    if (completed) update.finishedAt = new Date();
    await getDB().collection("tournaments").updateOne(
      { _id: config.id },
      { $set: update }
    );
    const prizes = [["first", placements.first], ["second", placements.second], ["third", placements.third]];
    const awards = [];
    for (const [place, userId] of prizes) {
      if (!userId) continue;
      const award = await grantTournamentPrize(userId, { tournamentId: config.id, place, gold: tournament.prizes[place] });
      awards.push({ place, userId, ...award });
    }
    return { state: await getState(config), awards };
  });
}

module.exports = { listTournaments, registerForTournament, unregisterFromTournament, getReadyMatch, recordTournamentResult, activateIfDue, publicTournament, snapshotTournamentConfig, isTournamentComplete };
