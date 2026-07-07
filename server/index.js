require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const { WebSocketServer } = require("ws");
const { Game } = require("../public/engine");
const { getCardById } = require("../public/cards");
const { MAX_BOARD } = require("../public/deckRules");
const { connectDB, grantMatchEconomy, isDbEnabled } = require("./db");
const { router: authRouter, getSessionUserFromCookieHeader, isAuthEnabled } = require("./auth");
const { router: shopRouter } = require("./shop");
const { router: decksRouter } = require("./decks");
const { router: tradesRouter } = require("./trades");
const { getActiveDeckCardIds } = require("./deckService");
const { createRateLimiter, requireSameOrigin, setSecurityHeaders } = require("./security");

const PORT = process.env.PORT || 8443;
const HTTP_JSON_LIMIT = "32kb";
const WS_MAX_PAYLOAD_BYTES = 16 * 1024;
const WS_RATE_WINDOW_MS = 5 * 1000;
const WS_RATE_MAX_MESSAGES = 30;
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
const BOARD_KEYWORD_LIMITS = { taunt: 2, charge: 3 };

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
app.get("/expansions/enabled", (req, res) => {
  const expansionsDir = path.join(__dirname, "..", "expansions");
  const expansions = fs
    .readdirSync(expansionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const metaPath = path.join(expansionsDir, entry.name, "expansion.json");
      if (!fs.existsSync(metaPath)) return null;
      return JSON.parse(fs.readFileSync(metaPath, "utf8"));
    })
    .filter((meta) => meta && meta.enabled !== false)
    .map((meta) => ({ id: meta.id, name: meta.name || meta.id }));

  res.json({ expansions });
});
app.use(
  express.static(path.join(__dirname, "..", "public"), {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html") || filePath.endsWith(".js")) {
        res.setHeader("Cache-Control", "no-store");
      }
    },
  })
);

const server = app.listen(PORT, () => {
  console.log(`TCG server listening on http://localhost:${PORT}`);
  if (isDbEnabled()) {
    connectDB()
      .then(() => console.log("Player accounts: enabled (MongoDB connected)."))
      .catch((err) => console.error("MongoDB connection failed — accounts will be unavailable:", err.message));
  } else {
    console.log("Player accounts: disabled (no MONGODB_URI set). The game itself works fine without it.");
  }
  if (!isAuthEnabled()) {
    console.log("Discord login: disabled (missing DISCORD_CLIENT_ID/SECRET/REDIRECT_URI or JWT_SECRET).");
  }
});

const wss = new WebSocketServer({ server, maxPayload: WS_MAX_PAYLOAD_BYTES });

// roomCode -> { game, sockets, names, avatars, userIds, mode, rewardGranted, surrenderedBy }
const rooms = new Map();
const quickplayQueue = [];

function makeRoomCode() {
  let code;
  do {
    code = Math.random().toString(36).slice(2, 6).toUpperCase();
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
  room.sockets.forEach((ws, idx) => {
    if (ws) send(ws, "state", addPlayerVisuals(room.game.getStateFor(idx), room, idx));
  });
}

function addPlayerVisuals(state, room, viewerIdx) {
  const opponentIdx = viewerIdx === 0 ? 1 : 0;
  return {
    ...state,
    me: { ...state.me, avatarUrl: room.avatars?.[viewerIdx] || null },
    opponent: { ...state.opponent, avatarUrl: room.avatars?.[opponentIdx] || null },
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

function detachSocketFromRoom(ws, { notifyOpponent = false } = {}) {
  removeFromQuickplayQueue(ws);
  if (!ws.roomCode || !rooms.has(ws.roomCode)) return;

  const room = rooms.get(ws.roomCode);
  const idx = ws.playerIdx;
  if (idx !== null && room.sockets[idx] === ws) {
    room.sockets[idx] = null;
    if (notifyOpponent) {
      const otherIdx = idx === 0 ? 1 : 0;
      send(room.sockets[otherIdx], "opponentLeft", {});
    }
  }

  if (room.sockets.every((socket) => socket === null)) {
    rooms.delete(ws.roomCode);
  }

  ws.roomCode = null;
  ws.playerIdx = null;
}

async function startMultiplayerMatch(playerA, playerB) {
  const code = makeRoomCode();
  const decks = await Promise.all([getActiveDeckCardIds(playerA.user.id), getActiveDeckCardIds(playerB.user.id)]);
  const room = {
    game: new Game(code, playerA.name, playerB.name, { decks }),
    sockets: [playerA.ws, playerB.ws],
    names: [playerA.name, playerB.name],
    avatars: [playerA.user.avatarUrl || null, playerB.user.avatarUrl || null],
    userIds: [playerA.user.id, playerB.user.id],
    mode: "multiplayer",
    rewardGranted: false,
    surrenderedBy: null,
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

wss.on("connection", (ws, req) => {
  ws.playerIdx = null;
  ws.roomCode = null;
  ws.rateLimit = null;
  ws.sessionUserPromise = getSessionUserFromCookieHeader(req.headers.cookie);

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
    detachSocketFromRoom(ws, { notifyOpponent: true });
  });
});

async function requireSessionUser(ws) {
  const user = await ws.sessionUserPromise;
  if (!user) throw new Error("Login with Discord is required to play.");
  return user;
}

function resultFor(game, idx) {
  if (game.winner === "draw") return "draw";
  return game.winner === idx ? "win" : "loss";
}

async function settleRewards(room) {
  if (!room.game || room.game.winner === null || room.rewardGranted) return;
  room.rewardGranted = true;

  await Promise.all(
    room.userIds.map(async (userId, idx) => {
      if (!userId) return;
      const economy = await grantMatchEconomy(userId, {
        mode: room.mode,
        result: resultFor(room.game, idx),
        surrendered: room.surrenderedBy === idx,
      });
      send(room.sockets[idx], "economyUpdate", economy);
    })
  );
}

function chooseNpcPlayable(game) {
  const npc = game.players[1];
  let best = null;
  npc.hand.forEach((cardId, handIndex) => {
    const card = getCardById(cardId);
    if (!card || card.cost > npc.manaCurrent) return;
    if (!canNpcFitCardOnBoard(npc.board, card)) return;
    if (!best || card.cost > best.card.cost) best = { card, handIndex };
  });
  return best;
}

function canNpcFitCardOnBoard(board, card) {
  if (card.type !== "minion") return true;
  if (board.length >= MAX_BOARD) return false;
  const keywords = card.keywords || [];
  return Object.entries(BOARD_KEYWORD_LIMITS).every(([keyword, limit]) => {
    if (!keywords.includes(keyword)) return true;
    return board.filter((minion) => minion.keywords.includes(keyword)).length < limit;
  });
}

function npcSpellTarget(game, card) {
  if (card.effect === "damage") return "faceEnemy";
  if (card.effect === "heal") return null;
  return null;
}

async function runNpcTurn(room) {
  const game = room.game;
  if (game.winner !== null || game.turn !== 1) return;
  if (room.npcTurnRunning) return;
  room.npcTurnRunning = true;

  try {
    await sleep(NPC_STEP_DELAY_MS);

    const play = chooseNpcPlayable(game);
    if (play && game.winner === null && game.turn === 1) {
      try {
        game.playCard(1, play.handIndex, npcSpellTarget(game, play.card));
        broadcastState(room);
        await sleep(NPC_STEP_DELAY_MS);
      } catch (err) {
        // Skip illegal NPC plays; the game state remains authoritative.
      }
    }

    let attackGuard = 0;
    while (game.winner === null && game.turn === 1 && attackGuard++ < 12) {
      const attacker = game.players[1].board.find((minion) => minion.canAttack);
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
  } finally {
    room.npcTurnRunning = false;
  }
}

async function handleMessage(ws, msg) {
  const { type, payload } = msg;

  if (type === "startSingleplayer") {
    const user = await requireSessionUser(ws);
    detachSocketFromRoom(ws);
    const playerDeck = await getActiveDeckCardIds(user.id);
    const code = makeRoomCode();
    const name = user.username || "Player";
    const room = {
      game: new Game(code, name, "NPC", { decks: [playerDeck] }),
      sockets: [ws, null],
      names: [name, "NPC"],
      avatars: [user.avatarUrl || null, null],
      userIds: [user.id, null],
      mode: "singleplayer",
      rewardGranted: false,
      surrenderedBy: null,
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
    detachSocketFromRoom(ws);
    const name = user.username || "Player 1";
    const code = makeRoomCode();
    rooms.set(code, {
      game: null,
      sockets: [ws, null],
      names: [name, null],
      avatars: [user.avatarUrl || null, null],
      userIds: [user.id, null],
      mode: "multiplayer",
      rewardGranted: false,
      surrenderedBy: null,
    });
    ws.roomCode = code;
    ws.playerIdx = 0;
    send(ws, "roomCreated", { roomCode: code });
    return;
  }

  if (type === "joinRoom") {
    const user = await requireSessionUser(ws);
    detachSocketFromRoom(ws);
    const code = (payload && payload.roomCode || "").toUpperCase().trim();
    const name = user.username || "Player 2";
    const room = rooms.get(code);
    if (!room) return broadcastError(ws, "Room not found.");
    if (room.sockets[1]) return broadcastError(ws, "That room is already full.");

    room.sockets[1] = ws;
    room.names[1] = name;
    room.avatars[1] = user.avatarUrl || null;
    room.userIds[1] = user.id;
    ws.roomCode = code;
    ws.playerIdx = 1;

    const decks = await Promise.all(room.userIds.map((userId) => getActiveDeckCardIds(userId)));
    room.game = new Game(code, room.names[0], room.names[1], { decks });
    send(room.sockets[0], "matchStarted", {});
    send(room.sockets[1], "matchStarted", {});
    broadcastState(room);
    return;
  }

  if (type === "quickplay") {
    const user = await requireSessionUser(ws);
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

  if (type === "cancelQuickplay") {
    removeFromQuickplayQueue(ws);
    return;
  }

  // Everything past this point requires an active match
  const room = rooms.get(ws.roomCode);
  if (!room || !room.game) return broadcastError(ws, "You're not in an active match.");
  const game = room.game;
  const idx = ws.playerIdx;

  if (type === "playCard") {
    requireIntent(type, payload);
    game.playCard(idx, payload.handIndex, payload.targetInstanceId || null);
    broadcastState(room);
    if (room.mode === "singleplayer") await runNpcTurn(room);
    await settleRewards(room);
    return;
  }

  if (type === "attack") {
    requireIntent(type, payload);
    game.attack(idx, payload.attackerInstanceId, payload.targetInstanceId);
    broadcastState(room);
    if (room.mode === "singleplayer") await runNpcTurn(room);
    await settleRewards(room);
    return;
  }

  if (type === "endTurn") {
    game.endTurn(idx);
    broadcastState(room);
    if (room.mode === "singleplayer") await runNpcTurn(room);
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
