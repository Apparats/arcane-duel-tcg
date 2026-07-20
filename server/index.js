require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const { WebSocketServer } = require("ws");
const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");
const { buildRandomLegalDeck } = require("../public/deckRules");
const { connectDB, getCampaignProgress, grantCampaignReward, grantMatchEconomy, getPublicPlayerProfile, getQuickplayRanking, isDbEnabled, recordCampaignResult, recordMultiplayerDisconnect, resetConsecutiveDisconnects, searchPublicPlayers, setDisplayName, setEquippedBadges, setSelectedTitle, submitCardRequest } = require("./db");
const { listTournaments, registerForTournament, unregisterFromTournament, getReadyMatch, recordTournamentResult, recordTournamentMatchArrival, clearTournamentMatchArrival, clearTournamentMatchNoShowDeadline } = require("./tournaments/service");
const { TOURNAMENT_TURN_DURATION_MS, TOURNAMENT_RECONNECT_GRACE_MS, TOURNAMENT_READY_GRACE_MS } = require("./tournaments/rules");
const { router: authRouter, getSessionUser, isAuthEnabled } = require("./auth");
const { router: shopRouter } = require("./shop");
const { router: decksRouter } = require("./decks");
const { router: tradesRouter } = require("./trades");
const { getActiveDeckCardIds } = require("./deckService");
const { createRateLimiter, isTrustedWebSocketOrigin, requireSameOrigin, setSecurityHeaders } = require("./security");
const { TournamentMatchStartQueue } = require("./tournaments/matchStartQueue");
const { DEFAULT_RECONNECT_GRACE_MS, startReconnectGrace, clearReconnectGrace, clearAllReconnectGraces } = require("./reconnectService");
const { assertUserCanStartMatch, assertUserIsNotAlreadyInRoom } = require("./matchAccess");
const { discardActiveSingleplayerMatch } = require("./singleplayerMatchService");
const { clearTurnTimer, ensureTurnTimer, turnKey } = require("./turnTimerService");
const { cleanupExpiredWsTickets, consumeWsTicket } = require("./wsTicketService");
const { secureRandomCode, secureRandomInt } = require("./random");
const { createCampaignMatch, getCampaignEncounter, listCampaignEncounters } = require("./campaigns");
const { createShieldChallenge, recordShieldInput, resolveShieldChallenge, scaleShieldChallenge } = require("./campaigns/shieldChallenge");

const PORT = process.env.PORT || 8443;
const HTTP_JSON_LIMIT = "32kb";
const WS_MAX_PAYLOAD_BYTES = 16 * 1024;
const WS_RATE_WINDOW_MS = 5 * 1000;
const WS_RATE_MAX_MESSAGES = 30;
const WS_HEARTBEAT_INTERVAL_MS = 15_000;
const MAX_WS_CONNECTIONS = readBoundedEnvInt("MAX_WS_CONNECTIONS", 200, { min: 10, max: 2_000 });
const MAX_WS_SOCKETS_PER_USER = readBoundedEnvInt("MAX_WS_SOCKETS_PER_USER", 3, { min: 1, max: 10 });
const MAX_WS_SOCKETS_PER_IP = readBoundedEnvInt("MAX_WS_SOCKETS_PER_IP", 5, { min: 1, max: 100 });
const TOURNAMENT_MATCH_START_CONCURRENCY = readBoundedEnvInt("TOURNAMENT_MATCH_START_CONCURRENCY", 2, { min: 1, max: 8 });
const CLIENT_TIMING_FIELDS = new Set([
  "clientnow",
  "clienttime",
  "deadline",
  "duration",
  "elapsedms",
  "remainingms",
  "servernow",
  "time",
  "timestamp",
  "turndeadline",
  "turnstartedat",
]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const NPC_STEP_DELAY_MS = 1200;
const SPELL_REVEAL_MS = 800;
const MATCH_INTRO_DURATION_MS = 4200;
const EMOTE_COOLDOWN_MS = 1_500;
const ALLOWED_EMOTES = new Set(["😄", "😭", "😯", "😡", "🫄", "💀"]);
const PUBLIC_DIR = path.join(__dirname, "..", "public");
let enabledExpansionsCache = null;

function readBoundedEnvInt(name, fallback, { min, max }) {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function getEnabledExpansions() {
  if (enabledExpansionsCache) return enabledExpansionsCache;

  const expansionsDir = path.join(__dirname, "..", "expansions");
  enabledExpansionsCache = fs
    .readdirSync(expansionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const metaPath = path.join(expansionsDir, entry.name, "expansion.json");
      if (!fs.existsSync(metaPath)) return null;
      return JSON.parse(fs.readFileSync(metaPath, "utf8"));
    })
    .filter((meta) => meta && meta.enabled !== false)
    .map((meta) => ({ id: meta.id, name: meta.name || meta.id }));

  return enabledExpansionsCache;
}

const app = express();
app.set("trust proxy", 1); // needed behind Cloudflare/any reverse proxy, so secure cookies work correctly
app.use(cookieParser());
app.use(setSecurityHeaders);
app.use(express.json({ limit: HTTP_JSON_LIMIT }));
app.use(requireSameOrigin);
app.post("/client-log", createRateLimiter({ max: 60, keyPrefix: "client-log" }), (req, res) => {
  const event = req.body && typeof req.body === "object" ? req.body : {};
  const type = typeof event.type === "string" ? event.type.slice(0, 80) : "unknown";
  const stage = typeof event.stage === "string" ? event.stage.slice(0, 80) : "unknown";
  const message = typeof event.message === "string" ? event.message.slice(0, 240) : "";
  const context = event.context && typeof event.context === "object" ? event.context : {};
  const safeContext = {
    embedded: Boolean(context.embedded),
    hasReferrer: Boolean(context.hasReferrer),
    hrefHost: typeof context.hrefHost === "string" ? context.hrefHost.slice(0, 120) : "",
    referrerHost: typeof context.referrerHost === "string" ? context.referrerHost.slice(0, 120) : "",
    searchKeys: Array.isArray(context.searchKeys) ? context.searchKeys.slice(0, 12) : [],
  };
  console.warn("Client log:", JSON.stringify({ type, stage, message, context: safeContext }));
  res.json({ ok: true });
});
app.use("/auth", createRateLimiter({ max: 120, keyPrefix: "auth" }), authRouter);
app.use("/shop", createRateLimiter({ max: 40, keyPrefix: "shop" }), shopRouter);
app.use("/decks", createRateLimiter({ max: 80, keyPrefix: "decks" }), decksRouter);
app.use("/trades", createRateLimiter({ max: 80, keyPrefix: "trades" }), tradesRouter);
app.get("/campaigns", createRateLimiter({ max: 30, keyPrefix: "campaigns" }), async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });
  const progress = await getCampaignProgress(user.id);
  res.json({
    campaigns: listCampaignEncounters().map((campaign) => ({
      ...campaign,
      cardDrops: progress[campaign.id]?.cardDrops || {},
      goldRewardClaimed: progress[campaign.id]?.goldRewardClaimed === true,
    })),
  });
});
app.get("/ranking/quickplay", createRateLimiter({ max: 30, keyPrefix: "ranking" }), async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });
  try {
    res.json(await getQuickplayRanking(user.id, 50));
  } catch (err) {
    console.error("Quickplay ranking failed:", err.message);
    res.status(500).json({ error: "Could not load the quickplay ranking." });
  }
});
app.get("/tournaments", createRateLimiter({ max: 30, keyPrefix: "tournaments" }), async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });
  try {
    res.json({ tournaments: await listTournaments(user.id) });
  } catch (err) {
    console.error("Tournament list failed:", err.message);
    res.status(500).json({ error: "Could not load tournaments." });
  }
});
app.post("/tournaments/:id/register", createRateLimiter({ max: 20, keyPrefix: "tournament-register" }), async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });
  try {
    res.json({ tournament: await registerForTournament(req.params.id, user) });
  } catch (err) {
    res.status(400).json({ error: err.message || "Could not register for this tournament." });
  }
});
app.delete("/tournaments/:id/register", createRateLimiter({ max: 20, keyPrefix: "tournament-unregister" }), async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });
  try {
    res.json({ tournament: await unregisterFromTournament(req.params.id, user.id) });
  } catch (err) {
    res.status(400).json({ error: err.message || "Could not cancel tournament registration." });
  }
});
app.get("/players/search", createRateLimiter({ max: 30, keyPrefix: "players-search" }), async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });
  try {
    res.json({ players: await searchPublicPlayers(req.query?.q, 8) });
  } catch (err) {
    console.error("Player search failed:", err.message);
    res.status(500).json({ error: "Could not search players." });
  }
});
app.get("/players/:id/profile", createRateLimiter({ max: 30, keyPrefix: "players-profile" }), async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });
  try {
    const profile = await getPublicPlayerProfile(req.params.id);
    if (!profile) return res.status(404).json({ error: "Player not found." });
    res.json({ profile });
  } catch (err) {
    console.error("Player profile failed:", err.message);
    res.status(400).json({ error: "Could not load that player." });
  }
});
app.put("/account/title", createRateLimiter({ max: 20, keyPrefix: "account-title" }), async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });
  try {
    const profile = await setSelectedTitle(user.id, String(req.body?.titleId || ""));
    res.json({ profile });
  } catch (err) {
    console.error("Title selection failed:", err.message);
    res.status(400).json({ error: err.message || "Could not update title." });
  }
});
app.put("/account/badges", createRateLimiter({ max: 20, keyPrefix: "account-badges" }), async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });
  try {
    res.json({ profile: await setEquippedBadges(user.id, req.body?.achievementIds) });
  } catch (err) {
    res.status(400).json({ error: err.message || "Could not update achievement badges." });
  }
});
app.put("/account/display-name", createRateLimiter({ max: 10, keyPrefix: "account-display-name" }), async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });
  try {
    res.json({ profile: await setDisplayName(user.id, req.body?.displayName) });
  } catch (err) {
    res.status(400).json({ error: err.message || "Could not update username." });
  }
});
app.post("/card-requests", createRateLimiter({ max: 10, keyPrefix: "card-requests" }), async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });
  try {
    const request = await submitCardRequest(user.id, req.body?.wareraName);
    res.json({ ok: true, wareraName: request.wareraName });
  } catch (err) {
    const status = err.code === "CARD_REQUEST_DAILY_LIMIT" ? 429 : 400;
    res.status(status).json({ error: err.message || "Could not save the card request." });
  }
});
app.get("/expansions/enabled", (req, res) => {
  res.json({ expansions: getEnabledExpansions() });
});
app.use((req, res, next) => {
  const version = typeof req.query?.v === "string" ? req.query.v : "";
  if (/^[a-zA-Z0-9._-]{1,80}$/.test(version) && /\.(?:css|js)$/.test(req.path)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  next();
});
app.use(
  express.static(PUBLIC_DIR, {
    setHeaders(res, filePath) {
      const relativePath = path.relative(PUBLIC_DIR, filePath).split(path.sep).join("/");
      if (/^assets\/audio\/.+\.(?:ogg|wav)$/i.test(relativePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (filePath.endsWith(".html") || filePath.endsWith("service-worker.js") || filePath.endsWith("manifest.webmanifest")) {
        res.setHeader("Cache-Control", "no-store");
      } else if ((filePath.endsWith(".css") || filePath.endsWith(".js")) && !res.getHeader("Cache-Control")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

const server = app.listen(PORT, () => {
  console.log(`TCG server listening on http://localhost:${PORT}`);
  if (isDbEnabled()) {
    connectDB()
      .then(() => {
        console.log("Player accounts: enabled (MongoDB connected). ");
        setInterval(() => listTournaments(null).catch((err) => console.error("Tournament scheduler failed:", err.message)), 30_000).unref();
      })
      .catch((err) => console.error("MongoDB connection failed — accounts will be unavailable:", err.message));
  } else {
    console.log("Player accounts: disabled (no MONGODB_URI set). The game itself works fine without it.");
  }
  if (!isAuthEnabled()) {
    console.log("Discord login: disabled (missing DISCORD_CLIENT_ID/SECRET/REDIRECT_URI or JWT_SECRET).");
  }
});

const wss = new WebSocketServer({ noServer: true, maxPayload: WS_MAX_PAYLOAD_BYTES });

// roomCode -> { game, sockets, names, avatars, userIds, mode, rewardGranted, surrenderedBy, reconnects }
const rooms = new Map();
const quickplayQueue = [];
const tournamentQueues = new Map();
const tournamentMatchStarts = new Map();
const tournamentNoShowResolutions = new Set();
const tournamentMatchStartQueue = new TournamentMatchStartQueue({ concurrency: TOURNAMENT_MATCH_START_CONCURRENCY });
const socketsByUserId = new Map();
const socketsByIp = new Map();

app.get("/players/online", createRateLimiter({ max: 60, keyPrefix: "online-players" }), (req, res) => {
  res.json({ online: Math.max(5, socketsByUserId.size) });
});

function registerAuthenticatedSocket(ws, user) {
  const userId = String(user.id);
  const sockets = socketsByUserId.get(userId) || new Set();
  if (sockets.size >= MAX_WS_SOCKETS_PER_USER) return false;
  sockets.add(ws);
  socketsByUserId.set(userId, sockets);
  ws.authenticatedUserId = userId;
  return true;
}

function unregisterAuthenticatedSocket(ws) {
  const userId = ws.authenticatedUserId;
  if (!userId) return;
  const sockets = socketsByUserId.get(userId);
  sockets?.delete(ws);
  if (!sockets || sockets.size === 0) socketsByUserId.delete(userId);
  ws.authenticatedUserId = null;
}

function requestIp(req) {
  const cloudflareIp = req.headers["cf-connecting-ip"];
  if (typeof cloudflareIp === "string" && cloudflareIp.length <= 64) return cloudflareIp;
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim().slice(0, 64);
  return String(req.socket.remoteAddress || "unknown").slice(0, 64);
}

function registerSocketIp(ws, ip) {
  const sockets = socketsByIp.get(ip) || new Set();
  if (sockets.size >= MAX_WS_SOCKETS_PER_IP) return false;
  sockets.add(ws);
  socketsByIp.set(ip, sockets);
  ws.clientIp = ip;
  return true;
}

function unregisterSocketIp(ws) {
  const ip = ws.clientIp;
  if (!ip) return;
  const sockets = socketsByIp.get(ip);
  sockets?.delete(ws);
  if (!sockets || sockets.size === 0) socketsByIp.delete(ip);
  ws.clientIp = null;
}

function rejectUpgrade(socket, statusCode, statusText) {
  socket.write(`HTTP/1.1 ${statusCode} ${statusText}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

function makeRoomCode() {
  let code;
  do {
    code = secureRandomCode(4);
  } while (rooms.has(code));
  return code;
}

function send(ws, type, payload) {
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

function broadcastState(room) {
  if (!room.game) return;
  syncTurnTimer(room);
  room.sockets.forEach((ws, idx) => {
    if (ws) send(ws, "state", addPlayerVisuals(room.game.getStateFor(idx), room, idx));
  });
}

function broadcastSpellCast(room, playerIdx, card) {
  room.sockets.forEach((ws, viewerIdx) => {
    if (ws) send(ws, "spellCast", { cardId: card.id, isSelf: viewerIdx === playerIdx });
  });
}

function broadcastMythicSummon(room, playerIdx, card) {
  room.sockets.forEach((ws, viewerIdx) => {
    if (ws) send(ws, "mythicSummon", { cardId: card.id, isSelf: viewerIdx === playerIdx });
  });
}

async function playCardWithReveal(room, playerIdx, handIndex, targetInstanceId) {
  const cardRef = room.game.players[playerIdx]?.hand[handIndex];
  const card = getCardById(String(cardRef || "").split("|")[0]);
  if (card?.type === "spell") {
    broadcastSpellCast(room, playerIdx, card);
    await sleep(SPELL_REVEAL_MS);
  } else if (card?.type === "minion" && card.rarity === "mythic") {
    broadcastMythicSummon(room, playerIdx, card);
    await sleep(SPELL_REVEAL_MS);
  }
  room.game.playCard(playerIdx, handIndex, targetInstanceId || null);
}

function shouldRunTurnTimer(room) {
  return (!isNpcMatch(room) || room.game.turn === 0) && !room.reconnects?.some(Boolean);
}

function isNpcMatch(room) {
  return room.mode === "singleplayer" || room.mode === "campaign";
}

function syncTurnTimer(room) {
  if (!room.game || room.game.winner !== null || !shouldRunTurnTimer(room)) {
    clearTurnTimer(room);
    return;
  }
  const introRemainingMs = (room.introEndsAt || 0) - Date.now();
  if (introRemainingMs > 0) {
    clearTurnTimer(room);
    if (!room.introTimer) {
      room.introTimer = setTimeout(() => {
        room.introTimer = null;
        if (rooms.get(room.game?.roomCode) === room) broadcastState(room);
      }, introRemainingMs);
    }
    return;
  }
  const defaultDurationMs = room.tournament ? TOURNAMENT_TURN_DURATION_MS : 40_000;
  const pausedDurationMs = Number.isFinite(room.pausedTurnRemainingMs)
    ? Math.max(250, room.pausedTurnRemainingMs)
    : defaultDurationMs;
  room.pausedTurnRemainingMs = null;
  ensureTurnTimer(room, expireTurn, { durationMs: pausedDurationMs });
}

async function expireTurn(room, expectedTurnKey) {
  if (!room.game || room.game.winner !== null || turnKey(room.game) !== expectedTurnKey) return;
  const playerIdx = room.game.turn;
  room.game._addLog(`${room.game.players[playerIdx].name}'s turn expired.`);
  room.game.endTurn(playerIdx);
  broadcastState(room);
  if (isNpcMatch(room)) await runNpcTurn(room);
  await settleRewards(room);
}

function addPlayerVisuals(state, room, viewerIdx) {
  const opponentIdx = viewerIdx === 0 ? 1 : 0;
  return {
    ...state,
    serverNow: Date.now(),
    turnDeadline: room.turnTimer?.deadline || null,
    turnDurationMs: room.turnTimer?.durationMs || null,
    matchIntroRemainingMs: Math.max(0, (room.introEndsAt || 0) - Date.now()),
    me: {
      ...state.me,
      avatarUrl: room.avatars?.[viewerIdx] || null,
      profile: matchProfile(room, viewerIdx),
      starts: room.game.startingPlayerIdx === viewerIdx,
    },
    opponent: {
      ...state.opponent,
      avatarUrl: room.avatars?.[opponentIdx] || null,
      profile: matchProfile(room, opponentIdx),
      starts: room.game.startingPlayerIdx === opponentIdx,
    },
    campaignTheme: room.mode === "campaign" ? room.campaign?.theme || null : null,
    campaignBoardMusic: room.mode === "campaign" ? room.campaign?.audio?.boardMusic || null : null,
    tournament: room.tournament ? { id: room.tournament.id, matchId: room.tournament.matchId } : null,
  };
}

function matchProfile(room, playerIdx) {
  const profile = room.profiles?.[playerIdx];
  return {
    username: profile?.username || room.names?.[playerIdx] || "Player",
    avatarUrl: profile?.avatarUrl || room.avatars?.[playerIdx] || null,
    selectedTitle: profile?.selectedTitle || { name: playerIdx === 1 && isNpcMatch(room) ? "Arena Guardian" : "Arcane Initiate" },
    equippedBadges: Array.isArray(profile?.equippedBadges) ? profile.equippedBadges : [],
  };
}

function broadcastError(ws, message) {
  send(ws, "error", { message });
}

function isSocketRateLimited(ws) {
  const now = Date.now();
  if (!ws.rateLimit || now > ws.rateLimit.resetAt) {
    ws.rateLimit = { count: 1, resetAt: now + WS_RATE_WINDOW_MS };
    return false;
  }

  ws.rateLimit.count += 1;
  return ws.rateLimit.count > WS_RATE_MAX_MESSAGES;
}

function isValidClientMessage(msg) {
  return Boolean(msg && typeof msg === "object" && typeof msg.type === "string" && msg.type.length <= 40);
}

function isPlainPayload(payload) {
  return Boolean(payload && typeof payload === "object" && !Array.isArray(payload));
}

function hasClientTimingFields(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasClientTimingFields);
  return Object.entries(value).some(([key, nested]) => CLIENT_TIMING_FIELDS.has(String(key).toLowerCase()) || hasClientTimingFields(nested));
}

function isInstanceId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 32;
}

function isTargetId(value, allowedFaces = []) {
  return isInstanceId(value) || allowedFaces.includes(value);
}

function requireIntent(type, payload) {
  const data = isPlainPayload(payload) ? payload : {};

  if (type === "playCard") {
    if (!Number.isInteger(data.handIndex) || data.handIndex < 0 || data.handIndex >= 10) {
      throw new Error("Invalid card selection.");
    }
    if (data.targetInstanceId != null && !isTargetId(data.targetInstanceId, ["faceEnemy", "faceSelf"])) {
      throw new Error("Invalid target.");
    }
    return;
  }

  if (type === "attack") {
    if (!isInstanceId(data.attackerInstanceId)) throw new Error("Invalid attacker.");
    if (!isTargetId(data.targetInstanceId, ["face"])) throw new Error("Invalid target.");
  }
}

function removeFromQuickplayQueue(ws) {
  const index = quickplayQueue.findIndex((entry) => entry.ws === ws);
  if (index >= 0) quickplayQueue.splice(index, 1);
}

function removeFromTournamentQueues(ws) {
  for (const [key, entry] of tournamentQueues) {
    if (entry.ws === ws) {
      clearTournamentQueueEntry(entry);
      clearTournamentQueueArrival(entry);
      tournamentQueues.delete(key);
    }
  }
}

function clearTournamentQueueEntry(entry) {
  if (entry?.noShowTimer) clearTimeout(entry.noShowTimer);
  if (entry) {
    entry.noShowTimer = null;
    entry.noShowDeadline = null;
  }
}

function clearTournamentQueueArrival(entry) {
  if (!entry?.tournament?.id || !entry?.matchId || !entry?.user?.id) return;
  clearTournamentMatchArrival(entry.tournament.id, entry.matchId, entry.user.id)
    .catch((err) => console.error("Tournament queue arrival cleanup failed:", err.message));
}

function hasPendingTournamentStart(userId) {
  return [...tournamentMatchStarts.values()].some((entry) => entry.players.some((player) => String(player.user.id) === String(userId)));
}

function assertUserCanStartOrPrepareMatch(userId) {
  assertUserCanStartMatch(rooms, userId);
  if (!hasPendingTournamentStart(userId)) return;
  throw new Error("Your tournament match is preparing. Please wait a moment.");
}

function cancelPendingTournamentStart(ws) {
  for (const pending of tournamentMatchStarts.values()) {
    if (!pending.players.some((player) => player.ws === ws)) continue;
    pending.cancelled = true;
  }
}

function assertTournamentStartReady(pending) {
  if (pending.cancelled) throw new Error("Tournament match preparation was cancelled.");
  if (pending.players.some((player) => player.ws.readyState !== player.ws.OPEN)) {
    throw new Error("A player disconnected before the tournament match could start.");
  }
  pending.players.forEach((player) => assertUserCanStartMatch(rooms, player.user.id));
}

function queueTournamentMatchStart(queueKey, tournamentId, matchId, ready, players) {
  const existing = tournamentMatchStarts.get(queueKey);
  if (existing) return existing;

  const pending = { queueKey, tournamentId, matchId, config: ready.config, players, cancelled: false, position: null };
  tournamentMatchStarts.set(queueKey, pending);
  const queued = tournamentMatchStartQueue.enqueue(queueKey, async () => {
    assertTournamentStartReady(pending);
    const latest = await getReadyMatch(tournamentId, players[0].user.id);
    const hasSamePlayers = latest.match.id === matchId
      && latest.match.playerIds.every((id) => players.some((player) => String(player.user.id) === String(id)));
    if (!hasSamePlayers) throw new Error("That tournament match is no longer ready.");
    assertTournamentStartReady(pending);
    await startMultiplayerMatch(players[0], players[1], {
      matchType: "tournament",
      tournament: { id: latest.config.id, matchId, prizes: latest.config.prizes },
    });
    await clearTournamentMatchNoShowDeadline(tournamentId, matchId);
  });
  pending.position = queued.position;

  queued.promise.catch((err) => {
    const message = err.message || "Could not prepare the tournament match.";
    players.forEach((player) => send(player.ws, "tournamentMatchUnavailable", { tournamentId, matchId, message }));
  }).finally(() => {
    if (tournamentMatchStarts.get(queueKey) === pending) tournamentMatchStarts.delete(queueKey);
  });
  return pending;
}

function sendTournamentResultUpdates(recipients, result, prizes) {
  recipients.forEach((recipient) => {
    const socket = recipient?.socket || recipient?.ws;
    const userId = recipient?.userId || recipient?.user?.id;
    if (!socket || socket.readyState !== socket.OPEN) return;
    const prize = result.awards.find((award) => String(award.userId) === String(userId) && award.awarded);
    if (prize) send(socket, "tournamentPrize", {
      place: prize.place,
      gold: prizes?.[prize.place] || 0,
      balance: prize.gold,
      stats: prize.stats,
    });
    send(socket, "tournamentUpdated", {});
  });
}

async function resolveTournamentNoShow(queueKey, entry) {
  if (tournamentQueues.get(queueKey) !== entry) return;
  clearTournamentQueueEntry(entry);
  tournamentQueues.delete(queueKey);
  if (!entry.ws || entry.ws.readyState !== entry.ws.OPEN) {
    return;
  }

  tournamentNoShowResolutions.add(queueKey);
  try {
    const latest = await getReadyMatch(entry.tournament.id, entry.user.id);
    const matchStillReady = latest.match.id === entry.matchId
      && latest.match.playerIds.includes(String(entry.user.id));
    if (!matchStillReady) throw new Error("That tournament match is no longer ready.");

    const result = await recordTournamentResult(entry.tournament.id, entry.matchId, entry.user.id);
    send(entry.ws, "tournamentNoShowWin", {
      tournamentId: entry.tournament.id,
      matchId: entry.matchId,
      graceMs: TOURNAMENT_READY_GRACE_MS,
    });
    sendTournamentResultUpdates([entry], result, latest.config.prizes);
  } catch (err) {
    send(entry.ws, "tournamentMatchUnavailable", {
      tournamentId: entry.tournament.id,
      matchId: entry.matchId,
      message: err.message || "Tournament match preparation stopped. Please enter again.",
    });
  } finally {
    tournamentNoShowResolutions.delete(queueKey);
  }
}

function startTournamentNoShowTimer(queueKey, entry) {
  clearTournamentQueueEntry(entry);
  entry.noShowDeadline = Date.now() + TOURNAMENT_READY_GRACE_MS;
  entry.noShowTimer = setTimeout(() => {
    resolveTournamentNoShow(queueKey, entry).catch((err) => console.error("Tournament no-show forfeit failed:", err.message));
  }, TOURNAMENT_READY_GRACE_MS);
}

function cancelDisconnectedMatch(room, disconnectedIdx) {
  if (!room.game || room.sockets[disconnectedIdx] !== null || !room.reconnects?.[disconnectedIdx]) return;
  const roomCode = room.game.roomCode;
  if (rooms.get(roomCode) !== room) return;

  const opponentIdx = disconnectedIdx === 0 ? 1 : 0;
  if (room.game.winner === null && room.sockets[opponentIdx]) {
    clearReconnectGrace(room, disconnectedIdx);
    room.surrenderedBy = disconnectedIdx;
    room.game._addLog(`${room.names[disconnectedIdx]} forfeited after disconnecting.`);
    room.game.surrender(disconnectedIdx);
    send(room.sockets[opponentIdx], room.tournament ? "tournamentForfeitWin" : "opponentForfeitWin", {});
    broadcastState(room);
    settleRewards(room).catch((err) => console.error("Disconnect forfeit failed:", err.message));
    return;
  }

  clearAllReconnectGraces(room);
  clearTurnTimer(room);
  room.sockets.forEach((socket) => {
    if (!socket) return;
    send(socket, "matchCancelled", { message: "Match cancelled because a player did not reconnect within one minute." });
    socket.roomCode = null;
    socket.playerIdx = null;
  });
  rooms.delete(roomCode);
}

function pauseTurnTimerForReconnect(room) {
  if (room.turnTimer?.deadline) {
    room.pausedTurnRemainingMs = Math.max(0, room.turnTimer.deadline - Date.now());
  }
  clearTurnTimer(room);
}

function markMultiplayerDisconnected(room, playerIdx) {
  const graceMs = room.tournament ? TOURNAMENT_RECONNECT_GRACE_MS : DEFAULT_RECONNECT_GRACE_MS;
  const reconnect = startReconnectGrace(room, playerIdx, {
    graceMs,
    onExpired: cancelDisconnectedMatch,
  });
  pauseTurnTimerForReconnect(room);
  const opponentIdx = playerIdx === 0 ? 1 : 0;
  send(room.sockets[opponentIdx], "opponentDisconnected", {
    reconnectDeadline: reconnect.deadline,
    reconnectGraceMs: graceMs,
    isTournament: Boolean(room.tournament),
  });

  const userId = room.userIds[playerIdx];
  if (userId) {
    recordMultiplayerDisconnect(userId)
      .then((result) => {
        if (!Array.isArray(room.disconnectEvents)) room.disconnectEvents = [null, null];
        room.disconnectEvents[playerIdx] = result;
        if (room.sockets[playerIdx] && result.penaltyGold > 0) {
          send(room.sockets[playerIdx], "disconnectPenalty", result);
        }
        if (result.penalized) console.warn(`Disconnect penalty applied to user ${userId}.`);
      })
      .catch((err) => console.error("Failed to record multiplayer disconnect:", err.message));
  }
}

function detachSocketFromRoom(ws, { notifyOpponent = false } = {}) {
  removeFromQuickplayQueue(ws);
  removeFromTournamentQueues(ws);
  if (!ws.roomCode || !rooms.has(ws.roomCode)) return;

  const room = rooms.get(ws.roomCode);
  const idx = ws.playerIdx;
  if (idx !== null && room.sockets[idx] === ws) {
    clearReconnectGrace(room, idx);
    room.sockets[idx] = null;
    if (notifyOpponent) {
      const otherIdx = idx === 0 ? 1 : 0;
      send(room.sockets[otherIdx], "opponentLeft", {});
    }
  }

  if (room.sockets.every((socket) => socket === null) && !room.reconnects?.some(Boolean)) {
    rooms.delete(ws.roomCode);
  }

  ws.roomCode = null;
  ws.playerIdx = null;
}

function handleSocketClose(ws) {
  removeFromQuickplayQueue(ws);
  removeFromTournamentQueues(ws);
  cancelPendingTournamentStart(ws);
  if (!ws.roomCode || !rooms.has(ws.roomCode)) return;

  const room = rooms.get(ws.roomCode);
  const idx = ws.playerIdx;
  const activeMultiplayer = room.mode === "multiplayer" && room.game && room.game.winner === null;
  if (idx !== null && room.sockets[idx] === ws && activeMultiplayer) {
    room.sockets[idx] = null;
    ws.roomCode = null;
    ws.playerIdx = null;
    markMultiplayerDisconnected(room, idx);
    return;
  }

  detachSocketFromRoom(ws, { notifyOpponent: true });
}

async function startMultiplayerMatch(playerA, playerB, { matchType = "quickplay", tournament = null } = {}) {
  const code = makeRoomCode();
  const [decks, profiles] = await Promise.all([
    Promise.all([getActiveDeckCardIds(playerA.user.id), getActiveDeckCardIds(playerB.user.id)]),
    Promise.all([getPublicPlayerProfile(playerA.user.id), getPublicPlayerProfile(playerB.user.id)]),
  ]);
  const room = {
    game: new Game(code, playerA.name, playerB.name, {
      decks,
      randomInt: secureRandomInt,
      startingPlayerIdx: secureRandomInt(2),
      grantSecondPlayerManaCard: true,
    }),
    sockets: [playerA.ws, playerB.ws],
    names: [playerA.name, playerB.name],
    avatars: [playerA.user.avatarUrl || null, playerB.user.avatarUrl || null],
    userIds: [playerA.user.id, playerB.user.id],
    profiles,
    introEndsAt: Date.now() + MATCH_INTRO_DURATION_MS,
    mode: "multiplayer",
    matchType,
    tournament,
    rewardGranted: false,
    surrenderedBy: null,
    reconnects: [null, null],
    disconnectEvents: [null, null],
  };

  rooms.set(code, room);
  playerA.ws.roomCode = code;
  playerA.ws.playerIdx = 0;
  playerB.ws.roomCode = code;
  playerB.ws.playerIdx = 1;
  send(playerA.ws, "matchStarted", {});
  send(playerB.ws, "matchStarted", {});
  broadcastState(room);
}

server.on("upgrade", (req, socket, head) => {
  if (!isTrustedWebSocketOrigin(req)) return rejectUpgrade(socket, 403, "Forbidden");
  if (wss.clients.size >= MAX_WS_CONNECTIONS) return rejectUpgrade(socket, 503, "Service Unavailable");

  let ticket;
  try {
    ticket = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).searchParams.get("ticket");
  } catch {
    return rejectUpgrade(socket, 400, "Bad Request");
  }

  const user = consumeWsTicket(ticket);
  if (!user) return rejectUpgrade(socket, 401, "Unauthorized");

  const ip = requestIp(req);
  if ((socketsByIp.get(ip)?.size || 0) >= MAX_WS_SOCKETS_PER_IP) {
    return rejectUpgrade(socket, 429, "Too Many Requests");
  }
  if ((socketsByUserId.get(String(user.id))?.size || 0) >= MAX_WS_SOCKETS_PER_USER) {
    return rejectUpgrade(socket, 429, "Too Many Requests");
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.clientIp = ip;
    wss.emit("connection", ws, req, user);
  });
});

wss.on("connection", (ws, req, user) => {
  ws.playerIdx = null;
  ws.roomCode = null;
  ws.rateLimit = null;
  ws.isAlive = true;
  ws.sessionUser = user;
  if (!registerSocketIp(ws, ws.clientIp) || !registerAuthenticatedSocket(ws, user)) {
    unregisterSocketIp(ws);
    unregisterAuthenticatedSocket(ws);
    ws.close(1013, "Connection limit reached");
    return;
  }

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", async (raw) => {
    if (isSocketRateLimited(ws)) {
      broadcastError(ws, "Too many actions. Please slow down.");
      return ws.close(1008, "Rate limit exceeded");
    }

    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return broadcastError(ws, "Invalid message.");
    }
    if (!isValidClientMessage(msg)) return broadcastError(ws, "Invalid message.");
    if (hasClientTimingFields(msg.payload)) return broadcastError(ws, "Client timing fields are not accepted.");

    try {
      await handleMessage(ws, msg);
    } catch (err) {
      broadcastError(ws, err.message || "Unknown error.");
    }
  });

  ws.on("close", () => {
    unregisterSocketIp(ws);
    unregisterAuthenticatedSocket(ws);
    handleSocketClose(ws);
  });
});

const heartbeatTimer = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState !== ws.OPEN) return;
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, WS_HEARTBEAT_INTERVAL_MS);

wss.on("close", () => clearInterval(heartbeatTimer));
const ticketCleanupTimer = setInterval(cleanupExpiredWsTickets, 10_000);
ticketCleanupTimer.unref();

async function requireSessionUser(ws) {
  const user = ws.sessionUser;
  if (!user) throw new Error("Login with Discord is required to play.");
  return user;
}

function resultFor(game, idx) {
  if (game.winner === "draw") return "draw";
  return game.winner === idx ? "win" : "loss";
}

function isJohnny(name) {
  const configuredName = String(process.env.ARCANA_DEV_USERNAME || "Johnny").trim();
  return configuredName.length > 0 && String(name || "").trim().toLocaleLowerCase() === configuredName.toLocaleLowerCase();
}

async function settleRewards(room) {
  if (!room.game || room.game.winner === null || room.rewardGranted) return;
  room.rewardGranted = true;
  clearTurnTimer(room);

  if (room.mode === "campaign") {
    const userId = room.userIds[0];
    if (userId) {
      const result = resultFor(room.game, 0);
      const reward = result === "win"
        ? await grantCampaignReward(userId, room.campaign.id, room.campaign.rewards)
        : null;
      const profileStats = await recordCampaignResult(userId, {
        result,
        surrendered: room.surrenderedBy === 0,
        campaignId: room.campaign.id,
      });
      if (result === "win") send(room.sockets[0], "campaignReward", { ...reward, ...profileStats });
      else send(room.sockets[0], "profileStatsUpdate", profileStats);
    }
    return;
  }

  await Promise.all(
    room.userIds.map(async (userId, idx) => {
      if (!userId) return;
      const economy = await grantMatchEconomy(userId, {
        mode: room.mode,
        result: resultFor(room.game, idx),
        surrendered: room.surrenderedBy === idx,
        quickplay: room.matchType === "quickplay",
        johnnyWin: room.mode === "multiplayer" && room.game.winner === idx && isJohnny(room.names[idx === 0 ? 1 : 0]),
      });
      send(room.sockets[idx], "economyUpdate", economy);
    })
  );

  if (room.mode === "multiplayer") {
    clearAllReconnectGraces(room);
    await Promise.all(room.userIds.filter(Boolean).map((userId) => resetConsecutiveDisconnects(userId)));
  }

  if (room.tournament && room.game.winner !== "draw") {
    const winnerId = room.userIds[room.game.winner];
    const result = await recordTournamentResult(room.tournament.id, room.tournament.matchId, winnerId);
    sendTournamentResultUpdates(room.sockets.map((socket, idx) => ({ socket, userId: room.userIds[idx] })), result, room.tournament.prizes);
  }
}

async function resumeMultiplayerMatch(ws) {
  const user = await requireSessionUser(ws);
  const match = [...rooms.values()].find((room) => {
    if (room.mode !== "multiplayer" || !room.game || room.game.winner !== null) return false;
    const idx = room.userIds.findIndex((userId) => String(userId) === String(user.id));
    return idx >= 0 && room.sockets[idx] === null && room.reconnects?.[idx];
  });

  if (!match) {
    send(ws, "matchCancelled", { message: "Your multiplayer match is no longer available." });
    return;
  }

  const playerIdx = match.userIds.findIndex((userId) => String(userId) === String(user.id));
  clearReconnectGrace(match, playerIdx);
  match.sockets[playerIdx] = ws;
  ws.roomCode = match.game.roomCode;
  ws.playerIdx = playerIdx;
  send(ws, "matchResumed", {});
  if (match.disconnectEvents?.[playerIdx]?.penaltyGold > 0) {
    send(ws, "disconnectPenalty", match.disconnectEvents[playerIdx]);
  }
  send(match.sockets[playerIdx === 0 ? 1 : 0], "opponentReconnected", {});
  broadcastState(match);
}

function chooseNpcPlayable(game, { limitMythics = false } = {}) {
  const npc = game.players[1];
  const playerBoard = game.players[0].board;
  const hasMythicInPlay = limitMythics && npc.board.some((minion) => minion.rarity === "mythic");
  let best = null;
  npc.hand.forEach((cardRef, handIndex) => {
    const card = getCardById(String(cardRef).split("|")[0]);
    if (!card || card.cost > npc.manaCurrent) return;
    if (card.type !== "minion") return;
    // The standard NPC may still use its usual board-rule exceptions, but it
    // never controls more than one mythic minion at a time. Campaign bosses
    // deliberately opt out through the caller below.
    if (hasMythicInPlay && card.type === "minion" && card.rarity === "mythic") return;
    if (game.getBoardLimitError(1, card)) return;
    const needsEnemyMinion = cardRequiresEnemyMinionTarget(card);
    if (needsEnemyMinion && playerBoard.length === 0) return;
    if (!best || card.cost > best.card.cost) best = { card, handIndex };
  });
  return best;
}

function cardRequiresEnemyMinionTarget(card) {
  return (card.abilities || []).some((ability) =>
    ability.trigger === "onPlay" && ability.target === "enemyMinion" &&
    ["applyStatus", "returnEnemyMinionToDeck"].includes(ability.effect)
  );
}

function npcCardTarget(game, card) {
  if (cardRequiresEnemyMinionTarget(card)) {
    const target = game.players[0].board
      .slice()
      .sort((a, b) => b.attack - a.attack || b.health - a.health)[0];
    return target?.instanceId || null;
  }
  if (card.effect === "damage") return "faceEnemy";
  if (card.effect === "heal") return null;
  return null;
}

async function runCampaignShieldChallenge(room) {
  const config = room.campaign?.shieldChallenge;
  const game = room.game;
  const turnKey = `${game.turnNumber}:${game.turn}`;
  if (!config || game.winner !== null || game.turn !== 1 || room.shieldChallenge || room.campaignShieldTurnKey === turnKey) {
    return false;
  }
  if (!game.players[1].board.some((minion) => minion.cardId === config.cardId)) return false;

  room.campaignShieldTurnKey = turnKey;
  const activationCount = room.campaignShieldActivations || 0;
  const scaledConfig = scaleShieldChallenge(config, activationCount);
  room.campaignShieldActivations = activationCount + 1;
  const challenge = createShieldChallenge(scaledConfig, { randomInt: secureRandomInt });
  room.shieldChallenge = challenge;
  const sentAt = Date.now();
  send(room.sockets[0], "shieldChallengeStart", {
    challengeId: challenge.id,
    sourceName: getCardById(scaledConfig.cardId)?.name || "TheUnchained",
    startInMs: Math.max(0, challenge.startsAt - sentAt),
    durationMs: challenge.endsAt - challenge.startsAt,
    travelMs: scaledConfig.travelMs,
    arrows: challenge.arrows.map((arrow) => ({
      direction: arrow.direction,
      impactOffsetMs: arrow.impactAt - challenge.startsAt,
    })),
  });

  await sleep(Math.max(0, challenge.endsAt - Date.now()) + 80);
  if (room.shieldChallenge !== challenge) return true;

  const result = resolveShieldChallenge(challenge);
  room.shieldChallenge = null;
  const sourceName = getCardById(scaledConfig.cardId)?.name || "TheUnchained";
  if (result.damage > 0) game.applyHeroDamage(0, result.damage, `${sourceName}'s shield trial`);
  else if (result.hits > 0) game._addLog(`${sourceName}'s shield trial is survived without damage.`);
  else game._addLog(`${sourceName}'s shield trial is fully blocked.`);
  send(room.sockets[0], "shieldChallengeResult", result);
  broadcastState(room);
  return true;
}

async function runNpcTurn(room) {
  const game = room.game;
  if (game.winner !== null || game.turn !== 1) return;
  if (room.npcTurnRunning) return;
  room.npcTurnRunning = true;

  try {
    await runCampaignShieldChallenge(room);
    if (game.winner !== null || game.turn !== 1) return;
    await sleep(NPC_STEP_DELAY_MS);

    const play = chooseNpcPlayable(game, { limitMythics: room.mode === "singleplayer" });
    if (play && game.winner === null && game.turn === 1) {
      try {
        await playCardWithReveal(room, 1, play.handIndex, npcCardTarget(game, play.card));
        broadcastState(room);
        await runCampaignShieldChallenge(room);
        if (game.winner !== null || game.turn !== 1) return;
        await sleep(NPC_STEP_DELAY_MS);
      } catch (err) {
        // Skip illegal NPC plays; the game state remains authoritative.
      }
    }

    let attackGuard = 0;
    while (game.winner === null && game.turn === 1 && attackGuard++ < 12) {
      const attacker = game.players[1].board.find((minion) => minion.canAttack && minion.attack > 0);
      if (!attacker) break;
      const playerBoard = game.players[0].board;
      const taunt = playerBoard.find((m) => m.keywords.includes("taunt"));
      const target = taunt || playerBoard.find((m) => m.health <= attacker.attack);
      try {
        game.attack(1, attacker.instanceId, target ? target.instanceId : "face");
        broadcastState(room);
        await sleep(NPC_STEP_DELAY_MS);
      } catch (err) {
        break;
      }
    }

    if (game.winner === null && game.turn === 1) {
      game.endTurn(1);
      broadcastState(room);
    }
  } catch (err) {
    console.error("NPC turn failed:", err.message);
  } finally {
    try {
      // Never leave the player facing an inert NPC turn. This also covers an
      // unexpected card-effect or socket serialization failure mid-turn.
      if (game.winner === null && game.turn === 1) {
        game._addLog("NPC turn recovered after an unexpected error.");
        game.endTurn(1);
        broadcastState(room);
      }
    } catch (recoveryError) {
      console.error("NPC turn recovery failed:", recoveryError.message);
    } finally {
      room.npcTurnRunning = false;
    }
  }
}

async function handleMessage(ws, msg) {
  const { type, payload } = msg;

  if (type === "startSingleplayer") {
    const user = await requireSessionUser(ws);
    discardActiveSingleplayerMatch(rooms, user.id, { clearTurnTimer, clearAllReconnectGraces });
    assertUserCanStartOrPrepareMatch(user.id);
    detachSocketFromRoom(ws);
    const playerDeck = await getActiveDeckCardIds(user.id);
    const profile = await getPublicPlayerProfile(user.id);
    const code = makeRoomCode();
    const name = user.username || "Player";
    const npcDeck = buildRandomLegalDeck({
      randomInt: secureRandomInt,
      // The NPC deliberately does not cast spells, so keep its random deck
      // to playable minions while applying every normal deck-building limit.
      includeCard: (card) => card.type === "minion",
    });
    const room = {
      game: new Game(code, name, "NPC", { decks: [playerDeck, npcDeck], randomInt: secureRandomInt }),
      sockets: [ws, null],
      names: [name, "NPC"],
      avatars: [user.avatarUrl || null, null],
      userIds: [user.id, null],
      profiles: [profile, null],
      introEndsAt: Date.now() + MATCH_INTRO_DURATION_MS,
      mode: "singleplayer",
      rewardGranted: false,
      surrenderedBy: null,
      reconnects: [null, null],
      disconnectEvents: [null, null],
    };
    rooms.set(code, room);
    ws.roomCode = code;
    ws.playerIdx = 0;
    send(ws, "matchStarted", {});
    broadcastState(room);
    return;
  }

  if (type === "startCampaign") {
    const user = await requireSessionUser(ws);
    const campaign = getCampaignEncounter(payload?.campaignId);
    if (!campaign) return broadcastError(ws, "Campaign not found.");
    if (!campaign.available) return broadcastError(ws, "This campaign is not available yet.");
    discardActiveSingleplayerMatch(rooms, user.id, { clearTurnTimer, clearAllReconnectGraces });
    assertUserCanStartOrPrepareMatch(user.id);
    detachSocketFromRoom(ws);
    const playerDeck = await getActiveDeckCardIds(user.id);
    const profile = await getPublicPlayerProfile(user.id);
    const code = makeRoomCode();
    const match = createCampaignMatch(campaign, { roomCode: code, playerName: user.username || "Player", playerDeck, randomInt: secureRandomInt });
    const room = {
      game: match.game,
      sockets: [ws, null], names: [user.username || "Player", match.npc.name], avatars: [user.avatarUrl || null, match.npc.avatarUrl], userIds: [user.id, null], profiles: [profile, null], introEndsAt: Date.now() + MATCH_INTRO_DURATION_MS,
      mode: "campaign", campaign, rewardGranted: false, surrenderedBy: null, reconnects: [null, null], disconnectEvents: [null, null],
    };
    rooms.set(code, room);
    ws.roomCode = code;
    ws.playerIdx = 0;
    send(ws, "matchStarted", {});
    broadcastState(room);
    return;
  }

  if (type === "createRoom") {
    const user = await requireSessionUser(ws);
    assertUserCanStartOrPrepareMatch(user.id);
    detachSocketFromRoom(ws);
    const name = user.username || "Player 1";
    const code = makeRoomCode();
    const profile = await getPublicPlayerProfile(user.id);
    rooms.set(code, {
      game: null,
      sockets: [ws, null],
      names: [name, null],
      avatars: [user.avatarUrl || null, null],
      userIds: [user.id, null],
      profiles: [profile, null],
      mode: "multiplayer",
      matchType: "room",
      rewardGranted: false,
      surrenderedBy: null,
      reconnects: [null, null],
      disconnectEvents: [null, null],
    });
    ws.roomCode = code;
    ws.playerIdx = 0;
    send(ws, "roomCreated", { roomCode: code });
    return;
  }

  if (type === "joinRoom") {
    const user = await requireSessionUser(ws);
    const code = (payload && payload.roomCode || "").toUpperCase().trim();
    const name = user.username || "Player 2";
    const room = rooms.get(code);
    if (!room) return broadcastError(ws, "Room not found.");
    if (room.sockets[1]) return broadcastError(ws, "That room is already full.");
    assertUserCanStartOrPrepareMatch(user.id);
    assertUserIsNotAlreadyInRoom(room, user.id);
    detachSocketFromRoom(ws);

    room.sockets[1] = ws;
    room.names[1] = name;
    room.avatars[1] = user.avatarUrl || null;
    room.userIds[1] = user.id;
    room.profiles[1] = await getPublicPlayerProfile(user.id);
    room.introEndsAt = Date.now() + MATCH_INTRO_DURATION_MS;
    ws.roomCode = code;
    ws.playerIdx = 1;

    const decks = await Promise.all(room.userIds.map((userId) => getActiveDeckCardIds(userId)));
    room.game = new Game(code, room.names[0], room.names[1], {
      decks,
      randomInt: secureRandomInt,
      startingPlayerIdx: secureRandomInt(2),
      grantSecondPlayerManaCard: true,
    });
    send(room.sockets[0], "matchStarted", {});
    send(room.sockets[1], "matchStarted", {});
    broadcastState(room);
    return;
  }

  if (type === "resumeMatch") {
    await resumeMultiplayerMatch(ws);
    return;
  }

  if (type === "quickplay") {
    const user = await requireSessionUser(ws);
    assertUserCanStartOrPrepareMatch(user.id);
    detachSocketFromRoom(ws);
    const name = user.username || "Player";
    const opponentIndex = quickplayQueue.findIndex((entry) => entry.ws.readyState === entry.ws.OPEN && entry.user.id !== user.id);

    if (opponentIndex === -1) {
      quickplayQueue.push({ ws, user, name });
      send(ws, "quickplayQueued", {});
      return;
    }

    const opponent = quickplayQueue.splice(opponentIndex, 1)[0];
    await startMultiplayerMatch(opponent, { ws, user, name });
    return;
  }

  if (type === "tournamentJoinMatch") {
    const user = await requireSessionUser(ws);
    assertUserCanStartOrPrepareMatch(user.id);
    const tournamentId = typeof payload?.tournamentId === "string" ? payload.tournamentId : "";
    const matchId = typeof payload?.matchId === "string" ? payload.matchId : "";
    const ready = await getReadyMatch(tournamentId, user.id);
    if (ready.match.id !== matchId) return broadcastError(ws, "That tournament match is no longer ready.");

    const queueKey = `${tournamentId}:${matchId}`;
    if (tournamentNoShowResolutions.has(queueKey)) return broadcastError(ws, "That tournament match is being resolved. Refresh the bracket and try again.");
    await recordTournamentMatchArrival(tournamentId, matchId, user.id);
    const opponentId = ready.match.playerIds.find((id) => String(id) !== String(user.id));
    const waiting = tournamentQueues.get(queueKey);
    const entry = { ws, user, name: user.username || "Player", tournament: ready.config, matchId };
    if (!waiting || waiting.ws.readyState !== waiting.ws.OPEN || String(waiting.user.id) === String(user.id)) {
      if (waiting) {
        clearTournamentQueueEntry(waiting);
        clearTournamentQueueArrival(waiting);
        tournamentQueues.delete(queueKey);
      }
      detachSocketFromRoom(ws);
      tournamentQueues.set(queueKey, entry);
      startTournamentNoShowTimer(queueKey, entry);
      send(ws, "tournamentMatchQueued", {
        tournamentId,
        matchId,
        noShowDeadline: entry.noShowDeadline,
        noShowGraceMs: TOURNAMENT_READY_GRACE_MS,
      });
      return;
    }
    if (String(waiting.user.id) !== String(opponentId)) {
      clearTournamentQueueEntry(waiting);
      clearTournamentQueueArrival(waiting);
      tournamentQueues.delete(queueKey);
      return broadcastError(ws, "Your tournament opponent changed. Refresh the bracket and try again.");
    }

    clearTournamentQueueEntry(waiting);
    tournamentQueues.delete(queueKey);
    detachSocketFromRoom(waiting.ws);
    detachSocketFromRoom(ws);
    const pending = queueTournamentMatchStart(queueKey, tournamentId, matchId, ready, [waiting, entry]);
    pending.players.forEach((player) => send(player.ws, "tournamentMatchPreparing", {
      tournamentId,
      matchId,
      queuePosition: pending.position,
    }));
    return;
  }

  if (type === "cancelQuickplay") {
    removeFromQuickplayQueue(ws);
    return;
  }

  if (type === "cancelTournamentMatch") {
    removeFromTournamentQueues(ws);
    cancelPendingTournamentStart(ws);
    return;
  }

  // Everything past this point requires an active match
  const room = rooms.get(ws.roomCode);
  if (!room || !room.game) return broadcastError(ws, "You're not in an active match.");
  if (room.introEndsAt && Date.now() < room.introEndsAt) return broadcastError(ws, "The duel is about to begin.");
  const game = room.game;
  const idx = ws.playerIdx;

  if (type === "emote") {
    const emote = typeof payload?.emote === "string" ? payload.emote : "";
    if (!ALLOWED_EMOTES.has(emote)) return broadcastError(ws, "That emote is not available.");
    const now = Date.now();
    if (now - (ws.lastEmoteAt || 0) < EMOTE_COOLDOWN_MS) return;
    ws.lastEmoteAt = now;
    room.sockets.forEach((socket, recipientIdx) => send(socket, "emote", { emote, isSelf: recipientIdx === idx }));
    return;
  }

  if (type === "shieldChallengeInput") {
    const challenge = room.shieldChallenge;
    const challengeId = typeof payload?.challengeId === "string" ? payload.challengeId : "";
    const direction = typeof payload?.direction === "string" ? payload.direction : "";
    if (idx !== 0 || !challenge || challenge.id !== challengeId) return;
    recordShieldInput(challenge, direction);
    return;
  }

  if (room.reconnects?.some(Boolean) && type !== "surrender") {
    return broadcastError(ws, "Your opponent is reconnecting. Please wait for the match to resume or forfeit.");
  }

  if (type === "playCard") {
    requireIntent(type, payload);
    await playCardWithReveal(room, idx, payload.handIndex, payload.targetInstanceId || null);
    broadcastState(room);
    if (isNpcMatch(room)) await runNpcTurn(room);
    await settleRewards(room);
    return;
  }

  if (type === "attack") {
    requireIntent(type, payload);
    game.attack(idx, payload.attackerInstanceId, payload.targetInstanceId);
    broadcastState(room);
    if (isNpcMatch(room)) await runNpcTurn(room);
    await settleRewards(room);
    return;
  }

  if (type === "endTurn") {
    game.endTurn(idx);
    broadcastState(room);
    if (isNpcMatch(room)) await runNpcTurn(room);
    await settleRewards(room);
    return;
  }

  if (type === "surrender") {
    room.surrenderedBy = idx;
    game.surrender(idx);
    broadcastState(room);
    await settleRewards(room);
    return;
  }

  broadcastError(ws, "Unknown message type.");
}
