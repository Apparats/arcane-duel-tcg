const { getCardById } = require("../public/cards");
const { exchangeCardsBetweenUsers } = require("./db");
const { assertMongoKeySegment, sanitizeString } = require("./mongoSafety");

const CODE_LENGTH = 6;
const SESSION_TTL_MS = 30 * 60 * 1000;

const userCodes = new Map(); // userId -> code
const codeOwners = new Map(); // code -> public user
const sessions = new Map(); // sessionId -> trade session

function makeCode() {
  let code;
  do {
    code = Math.random().toString(36).slice(2, 2 + CODE_LENGTH).toUpperCase();
  } while (codeOwners.has(code));
  return code;
}

function makeSessionId() {
  return `trade_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function compactUser(user) {
  return {
    id: assertMongoKeySegment(user.id, "user id"),
    username: sanitizeString(user.username, { label: "username", fallback: "Player", max: 80 }),
    avatarUrl: user.avatarUrl || null,
  };
}

function cardSummary(cardId) {
  const card = getCardById(cardId);
  return card
    ? {
        id: card.id,
        name: card.name,
        rarity: card.rarity || "common",
        cost: card.cost,
        type: card.type,
      }
    : null;
}

function cleanupSessions() {
  const now = Date.now();
  sessions.forEach((session, id) => {
    if (session.status !== "pending") return;
    if (now - session.updatedAt > SESSION_TTL_MS) {
      session.status = "cancelled";
      session.updatedAt = now;
      sessions.set(id, session);
    }
  });
}

function getOrCreateTradeCode(user) {
  const userId = String(user.id);
  const existing = userCodes.get(userId);
  if (existing) {
    codeOwners.set(existing, compactUser(user));
    return existing;
  }

  const code = makeCode();
  userCodes.set(userId, code);
  codeOwners.set(code, compactUser(user));
  return code;
}

function refreshTradeCode(user) {
  const userId = String(user.id);
  const previous = userCodes.get(userId);
  if (previous) codeOwners.delete(previous);

  const code = makeCode();
  userCodes.set(userId, code);
  codeOwners.set(code, compactUser(user));
  return code;
}

function startTradeByCode(user, codeInput) {
  cleanupSessions();
  const code = assertMongoKeySegment(String(codeInput || "").trim().toUpperCase(), "trade code");
  const owner = codeOwners.get(code);
  if (!owner) {
    const err = new Error("Trade code not found.");
    err.code = "TRADE_CODE_NOT_FOUND";
    throw err;
  }
  if (owner.id === user.id) {
    const err = new Error("Send your code to another player first.");
    err.code = "SELF_TRADE";
    throw err;
  }

  const session = {
    id: makeSessionId(),
    status: "pending",
    players: [owner, compactUser(user)],
    offers: {},
    confirmed: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  sessions.set(session.id, session);
  return session;
}

function getSessionForUser(sessionId, user) {
  cleanupSessions();
  const safeSessionId = assertMongoKeySegment(sessionId, "trade session id");
  const session = sessions.get(safeSessionId);
  if (!session || !session.players.some((player) => player.id === user.id)) {
    const err = new Error("Trade session not found.");
    err.code = "TRADE_NOT_FOUND";
    throw err;
  }
  return session;
}

function listSessionsForUser(user) {
  cleanupSessions();
  return [...sessions.values()]
    .filter((session) => session.players.some((player) => player.id === user.id))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function publicTradeSession(session, viewerId) {
  const players = session.players.map((player) => ({
    ...player,
    offer: cardSummary(session.offers[player.id]),
    confirmed: Boolean(session.confirmed[player.id]),
    isYou: player.id === viewerId,
  }));

  return {
    id: session.id,
    status: session.status,
    players,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

function setTradeOffer(sessionId, user, cardId) {
  const session = getSessionForUser(sessionId, user);
  if (session.status !== "pending") throw new Error("Trade is no longer open.");
  const safeCardId = assertMongoKeySegment(cardId, "card id");
  if (!getCardById(safeCardId)) {
    const err = new Error("Unknown card.");
    err.code = "UNKNOWN_CARD";
    throw err;
  }

  session.offers[user.id] = safeCardId;
  session.confirmed = {};
  session.updatedAt = Date.now();
  return session;
}

async function confirmTrade(sessionId, user) {
  const session = getSessionForUser(sessionId, user);
  if (session.status !== "pending") throw new Error("Trade is no longer open.");
  const [first, second] = session.players;
  if (!session.offers[first.id] || !session.offers[second.id]) {
    const err = new Error("Both players must offer a card first.");
    err.code = "MISSING_OFFERS";
    throw err;
  }

  session.confirmed[user.id] = true;
  session.updatedAt = Date.now();

  if (session.confirmed[first.id] && session.confirmed[second.id]) {
    session.status = "settling";
    let exchange;
    try {
      exchange = await exchangeCardsBetweenUsers({
        fromUserId: first.id,
        toUserId: second.id,
        fromCardId: session.offers[first.id],
        toCardId: session.offers[second.id],
      });
    } catch (err) {
      session.status = "pending";
      session.confirmed = {};
      session.updatedAt = Date.now();
      throw err;
    }
    session.status = "completed";
    session.completedAt = Date.now();
    session.collectionUpdates = {
      [first.id]: exchange.from,
      [second.id]: exchange.to,
    };
  }

  return session;
}

function cancelTrade(sessionId, user) {
  const session = getSessionForUser(sessionId, user);
  if (session.status === "completed") return session;
  session.status = "cancelled";
  session.updatedAt = Date.now();
  return session;
}

function collectionUpdateFor(session, userId) {
  return session.collectionUpdates?.[userId] || null;
}

module.exports = {
  cancelTrade,
  collectionUpdateFor,
  confirmTrade,
  getOrCreateTradeCode,
  getSessionForUser,
  listSessionsForUser,
  publicTradeSession,
  refreshTradeCode,
  setTradeOffer,
  startTradeByCode,
};
