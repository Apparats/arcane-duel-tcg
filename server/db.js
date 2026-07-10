// ============================================================
// DATABASE — MongoDB connection + user account helpers.
// ------------------------------------------------------------
// Deliberately minimal: no ODM (Mongoose etc.), just the official
// driver and a couple of plain functions. If MONGODB_URI isn't set,
// the rest of the server (both game modes) still works fine — only
// the Discord-login-backed features are unavailable. See isDbEnabled().
// ============================================================

const { MongoClient } = require("mongodb");
const { buildPackOpening, summarizeOpening } = require("./cardRewards");
const { buildAutoDeck, validateDeck } = require("../public/deckRules");
const { assertMongoKeySegment, assertPositiveInteger, sanitizeDiscordProfile, toObjectId } = require("./mongoSafety");
const { withUserLock, withUserLocks } = require("./userLocks");

let client = null;
let db = null;
let connecting = null;

function isDbEnabled() {
  return Boolean(process.env.MONGODB_URI);
}

// Connects once and reuses the connection on every later call. Safe to
// call this from multiple places (e.g. every request) — it won't open
// a second connection.
async function connectDB() {
  if (!isDbEnabled()) {
    throw new Error("MONGODB_URI is not set — database features are disabled.");
  }
  if (db) return db;
  if (connecting) return connecting;

  connecting = (async () => {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || "arcane_duel");

    // Indexes are idempotent — safe to run every time the server boots.
    await db.collection("users").createIndex({ discordId: 1 }, { unique: true });

    console.log("MongoDB connected.");
    return db;
  })();

  return connecting;
}

function getDB() {
  if (!db) {
    throw new Error("Database not connected yet — call connectDB() during server startup first.");
  }
  return db;
}

function sanitizeCollectionIncrements(increments = {}) {
  return Object.fromEntries(
    Object.entries(increments).map(([cardId, amount]) => [assertMongoKeySegment(cardId, "card id"), amount])
  );
}

function buildInitialDeck(starterReward, now) {
  if (!starterReward) return null;
  const cardCollection = sanitizeCollectionIncrements(starterReward.collectionIncrements || {});
  const unlockedCards = starterReward.newCardIds || [];
  const cardIds = buildAutoDeck({ cardCollection, unlockedCards });
  const validation = validateDeck(cardIds, { cardCollection, unlockedCards });
  if (!validation.ok) {
    throw new Error(`Starter deck generation failed: ${validation.errors.join(" ")}`);
  }

  return {
    id: `starter_${now.getTime().toString(36)}`,
    name: "Starter Deck",
    cardIds,
    createdAt: now,
    updatedAt: now,
  };
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    connecting = null;
  }
}

// Finds a user by Discord id, creating one on first login. Updates the
// display name/avatar/lastLoginAt on every login so profile changes on
// Discord's side stay in sync.
async function findOrCreateUserFromDiscord(discordProfile, starterOpening = null) {
  const users = getDB().collection("users");
  const profile = sanitizeDiscordProfile(discordProfile);
  const now = new Date();
  const starterReward = starterOpening && starterOpening.length > 0 ? summarizeOpening(starterOpening, {}) : null;
  const pendingRewards = starterReward
    ? [{ type: "starter", title: "Starter Cards", createdAt: now, cards: starterReward.cards }]
    : [];
  const starterDeck = buildInitialDeck(starterReward, now);
  const starterCollection = sanitizeCollectionIncrements(starterReward?.collectionIncrements || {});

  const result = await users.updateOne(
    { discordId: profile.id },
    {
      $set: {
        username: profile.global_name || profile.username,
        discordUsername: profile.username,
        avatar: profile.avatar,
        lastLoginAt: now,
      },
      $setOnInsert: {
        discordId: profile.id,
        createdAt: now,
        unlockedCards: starterReward?.newCardIds || [],
        cardCollection: starterCollection,
        decks: starterDeck ? [starterDeck] : [],
        activeDeckId: starterDeck?.id || null,
        pendingRewards,
        stats: { wins: 0, losses: 0, surrenders: 0, packsOpened: 0, quickplayWins: 0 },
        gold: 0,
        warnings: [],
        economy: {
          dailyRewards: {},
        },
      },
    },
    { upsert: true }
  );

  const user = await users.findOne({ discordId: profile.id });
  user.wasCreated = Boolean(result.upsertedCount);
  return user;
}

async function findUserById(id) {
  return getDB().collection("users").findOne({ _id: toObjectId(id, "user id") });
}

async function consumePendingRewards(userId) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  const result = await users.findOneAndUpdate(
    { _id, pendingRewards: { $exists: true, $ne: [] } },
    { $set: { pendingRewards: [] } },
    { projection: { pendingRewards: 1 }, returnDocument: "before" }
  );
  return result?.pendingRewards || result?.value?.pendingRewards || [];
}

const DAILY_REWARD_LIMITS = {
  singleplayer: 50,
  multiplayer: 100,
};

const MATCH_REWARDS = {
  singleplayer: { win: 5, loss: 1 },
  multiplayer: { win: 10, loss: 4 },
};

const SURRENDER_GOLD_PENALTY = 10;
const DISCONNECT_GOLD_PENALTY = 20;
const DISCONNECT_PENALTY_THRESHOLD = 4;
const DAILY_LOGIN_GOLD = 50;
const PACK_PRICE_GOLD = 20;
const PACK_SIZE = 5;

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getDailyRewardProgress(user, date = new Date()) {
  const day = todayKey(date);
  const dailyRewards = user?.economy?.dailyRewards?.[day] || {};
  return Object.fromEntries(
    Object.entries(DAILY_REWARD_LIMITS).map(([mode, limit]) => [
      mode,
      {
        earned: dailyRewards[mode] || 0,
        limit,
      },
    ])
  );
}

function maxDeckUsage(decks = [], cardId) {
  return decks.reduce((max, deck) => {
    const used = (deck.cardIds || []).filter((id) => id === cardId).length;
    return Math.max(max, used);
  }, 0);
}

function assertCardCanBeTraded(user, cardId) {
  assertMongoKeySegment(cardId, "card id");
  const owned = user?.cardCollection?.[cardId] || 0;
  if (owned <= 0) {
    const err = new Error("You do not own that card.");
    err.code = "CARD_NOT_OWNED";
    throw err;
  }

  const requiredByDeck = maxDeckUsage(user.decks || [], cardId);
  if (owned - 1 < requiredByDeck) {
    const err = new Error("That copy is needed by one of your saved decks.");
    err.code = "CARD_LOCKED_BY_DECK";
    throw err;
  }
}

async function exchangeCardsBetweenUsers({ fromUserId, toUserId, fromCardId, toCardId }) {
  const users = getDB().collection("users");
  const fromId = toObjectId(fromUserId, "from user id");
  const toId = toObjectId(toUserId, "to user id");
  const safeFromCardId = assertMongoKeySegment(fromCardId, "from card id");
  const safeToCardId = assertMongoKeySegment(toCardId, "to card id");
  const now = new Date();

  if (String(fromUserId) === String(toUserId)) {
    const err = new Error("Cannot trade with yourself.");
    err.code = "SELF_TRADE";
    throw err;
  }

  return withUserLocks([String(fromId), String(toId)], async () => {
    const session = client.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        const [fromUser, toUser] = await Promise.all([
          users.findOne({ _id: fromId }, { session, projection: { cardCollection: 1, unlockedCards: 1, decks: 1 } }),
          users.findOne({ _id: toId }, { session, projection: { cardCollection: 1, unlockedCards: 1, decks: 1 } }),
        ]);
        if (!fromUser || !toUser) throw new Error("Trade user not found.");

        assertCardCanBeTraded(fromUser, safeFromCardId);
        assertCardCanBeTraded(toUser, safeToCardId);

        await users.updateOne(
          { _id: fromId },
          {
            $inc: {
              [`cardCollection.${safeFromCardId}`]: -1,
              [`cardCollection.${safeToCardId}`]: 1,
            },
            $addToSet: { unlockedCards: safeToCardId },
            $set: { updatedAt: now },
          },
          { session }
        );

        await users.updateOne(
          { _id: toId },
          {
            $inc: {
              [`cardCollection.${safeToCardId}`]: -1,
              [`cardCollection.${safeFromCardId}`]: 1,
            },
            $addToSet: { unlockedCards: safeFromCardId },
            $set: { updatedAt: now },
          },
          { session }
        );

        const [updatedFrom, updatedTo] = await Promise.all([
          users.findOne({ _id: fromId }, { session, projection: { cardCollection: 1, unlockedCards: 1 } }),
          users.findOne({ _id: toId }, { session, projection: { cardCollection: 1, unlockedCards: 1 } }),
        ]);

        result = {
          from: {
            cardCollection: updatedFrom.cardCollection || {},
            unlockedCards: updatedFrom.unlockedCards || [],
          },
          to: {
            cardCollection: updatedTo.cardCollection || {},
            unlockedCards: updatedTo.unlockedCards || [],
          },
        };
      });
      return result;
    } finally {
      await session.endSession();
    }
  });
}

async function grantMatchEconomy(userId, { mode, result, surrendered = false, quickplay = false }) {
  if (!["singleplayer", "multiplayer"].includes(mode)) throw new Error("Invalid economy mode.");
  if (!["win", "loss", "draw"].includes(result)) throw new Error("Invalid match result.");

  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  return withUserLock(String(_id), async () => {
  const now = new Date();
  const day = todayKey(now);
  const dailyField = `economy.dailyRewards.${day}.${mode}`;

  const user = await users.findOne({ _id }, { projection: { gold: 1, economy: 1, stats: 1 } });
  if (!user) throw new Error("User not found.");

  const earnedToday = user.economy?.dailyRewards?.[day]?.[mode] || 0;
  const dailyLimit = DAILY_REWARD_LIMITS[mode];
  const baseReward = surrendered || result === "draw" ? 0 : MATCH_REWARDS[mode][result];
  const awardedGold = Math.max(0, Math.min(baseReward, dailyLimit - earnedToday));
  const penaltyGold = surrendered && mode === "multiplayer" ? SURRENDER_GOLD_PENALTY : 0;
  const netGold = awardedGold - penaltyGold;

  const update = {
    $set: { updatedAt: now },
    $inc: {
      gold: netGold,
      [dailyField]: awardedGold,
    },
  };

  if (result === "win") update.$inc["stats.wins"] = 1;
  if (result === "win" && mode === "multiplayer" && quickplay) update.$inc["stats.quickplayWins"] = 1;
  if (result === "loss") update.$inc["stats.losses"] = 1;
  if (surrendered) {
    update.$inc["stats.surrenders"] = 1;
  }
  if (penaltyGold > 0) {
    update.$push = {
      warnings: {
        type: "surrender",
        message: `Surrender penalty: -${penaltyGold} gold.`,
        createdAt: now,
      },
    };
  }

  await users.updateOne({ _id }, update);
  const updated = await users.findOne({ _id });

  return {
    mode,
    result,
    surrendered,
    awardedGold,
    penaltyGold,
    netGold,
    dailyEarned: earnedToday + awardedGold,
    dailyLimit,
    gold: updated.gold || 0,
    warnings: updated.warnings || [],
    stats: updated.stats || { wins: 0, losses: 0, surrenders: 0 },
  };
  });
}

function publicRankingPlayer(user, rank) {
  return {
    rank,
    username: user.username || "Player",
    wins: user.stats?.quickplayWins || 0,
    avatarUrl: user.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : null,
    userId: String(user._id),
  };
}

function rankQuickplayPlayers(users, userId, limit = 50) {
  const safeLimit = Math.max(1, Math.min(Number.isInteger(limit) ? limit : 50, 50));
  const players = users.filter((user) => (user.stats?.quickplayWins || 0) > 0);

  players.sort((left, right) => {
    const winDiff = (right.stats?.quickplayWins || 0) - (left.stats?.quickplayWins || 0);
    return winDiff || String(left._id).localeCompare(String(right._id));
  });

  const ranked = players.map((player, index) => publicRankingPlayer(player, index + 1));
  const own = ranked.find((player) => player.userId === String(userId)) || null;
  return {
    players: ranked.slice(0, safeLimit),
    currentPlayer: own && own.rank > safeLimit ? own : null,
  };
}

async function getQuickplayRanking(userId, limit = 50) {
  const users = getDB().collection("users");
  const players = await users
    .find({ "stats.quickplayWins": { $gt: 0 } }, { projection: { username: 1, avatar: 1, discordId: 1, stats: 1 } })
    .toArray();
  return rankQuickplayPlayers(players, userId, limit);
}

async function recordMultiplayerDisconnect(userId) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  return withUserLock(String(_id), async () => {
    const user = await users.findOne({ _id }, { projection: { gold: 1, stats: 1, warnings: 1 } });
    if (!user) throw new Error("User not found.");

    const previousCount = user.stats?.consecutiveDisconnects || 0;
    const nextCount = previousCount + 1;
    const penalized = nextCount >= DISCONNECT_PENALTY_THRESHOLD;
    const penaltyGold = penalized ? Math.min(DISCONNECT_GOLD_PENALTY, user.gold || 0) : 0;
    const now = new Date();
    const update = {
      $set: {
        gold: Math.max(0, (user.gold || 0) - penaltyGold),
        "stats.consecutiveDisconnects": penalized ? 0 : nextCount,
        updatedAt: now,
      },
    };

    if (penalized) {
      update.$push = {
        warnings: {
          type: "disconnect",
          message: `Disconnect penalty: -${penaltyGold} gold after ${DISCONNECT_PENALTY_THRESHOLD} consecutive disconnects.`,
          createdAt: now,
        },
      };
    }

    await users.updateOne({ _id }, update);
    const updated = await users.findOne({ _id }, { projection: { gold: 1, stats: 1, warnings: 1 } });
    return {
      gold: updated?.gold || 0,
      consecutiveDisconnects: updated?.stats?.consecutiveDisconnects || 0,
      penaltyGold,
      penalized,
      warnings: updated?.warnings || [],
    };
  });
}

async function resetConsecutiveDisconnects(userId) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  return withUserLock(String(_id), async () => {
    await users.updateOne(
      { _id, "stats.consecutiveDisconnects": { $gt: 0 } },
      { $set: { "stats.consecutiveDisconnects": 0, updatedAt: new Date() } }
    );
  });
}

async function grantDailyLoginReward(userId, date = new Date()) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  const now = new Date();
  const day = todayKey(date);
  const claimedField = `economy.dailyRewards.${day}.login`;

  const result = await users.updateOne(
    { _id, [claimedField]: { $ne: true } },
    {
      $inc: { gold: DAILY_LOGIN_GOLD },
      $set: {
        [claimedField]: true,
        updatedAt: now,
      },
    }
  );

  const updated = await users.findOne({ _id }, { projection: { gold: 1 } });
  return {
    claimed: result.modifiedCount > 0,
    goldAwarded: result.modifiedCount > 0 ? DAILY_LOGIN_GOLD : 0,
    gold: updated?.gold || 0,
    day,
  };
}

async function buyPack(userId, pack) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  return withUserLock(String(_id), async () => {
  const now = new Date();
  const priceGold = assertPositiveInteger(pack.priceGold ?? PACK_PRICE_GOLD, "pack price", { min: 1, max: 100000 });
  const packSize = assertPositiveInteger(pack.size ?? PACK_SIZE, "pack size", { min: 1, max: 20 });
  const cards = pack.cards || [];

  const user = await users.findOne({ _id }, { projection: { gold: 1, unlockedCards: 1, cardCollection: 1 } });
  if (!user) throw new Error("User not found.");
  if (cards.length === 0) throw new Error("Pack has no cards.");
  if ((user.gold || 0) < priceGold) {
    const err = new Error(`Not enough gold. Packs cost ${priceGold} gold.`);
    err.code = "NOT_ENOUGH_GOLD";
    throw err;
  }

  const openedCards = buildPackOpening(cards, packSize);
  const opening = summarizeOpening(openedCards, user.cardCollection || {});
  const cardResults = opening.cards;
  const newCardIds = opening.newCardIds;
  const collectionInc = {};
  Object.entries(opening.collectionIncrements).forEach(([cardId, amount]) => {
    const safeCardId = assertMongoKeySegment(cardId, "card id");
    collectionInc[`cardCollection.${safeCardId}`] = amount;
  });

  const purchase = await users.updateOne(
    { _id, gold: { $gte: priceGold } },
    {
      $inc: { gold: -priceGold, "stats.packsOpened": 1, ...collectionInc },
      $addToSet: { unlockedCards: { $each: newCardIds } },
      $set: { updatedAt: now },
      $push: {
        packHistory: {
          createdAt: now,
          packId: pack.id,
          expansionId: pack.expansionId,
          cost: priceGold,
          cards: openedCards.map((card) => card.id),
          newCards: newCardIds,
        },
      },
    }
  );
  if (purchase.modifiedCount !== 1) {
    const err = new Error(`Not enough gold. Packs cost ${priceGold} gold.`);
    err.code = "NOT_ENOUGH_GOLD";
    throw err;
  }

  const updated = await users.findOne({ _id });
  return {
    packId: pack.id,
    expansionId: pack.expansionId,
    cost: priceGold,
    cards: cardResults,
    gold: updated.gold || 0,
    unlockedCards: updated.unlockedCards || [],
    cardCollection: updated.cardCollection || {},
    stats: updated.stats || { wins: 0, losses: 0, surrenders: 0, packsOpened: 0 },
  };
  });
}

module.exports = {
  isDbEnabled,
  connectDB,
  getDB,
  closeDB,
  findOrCreateUserFromDiscord,
  findUserById,
  consumePendingRewards,
  getDailyRewardProgress,
  grantDailyLoginReward,
  grantMatchEconomy,
  getQuickplayRanking,
  rankQuickplayPlayers,
  recordMultiplayerDisconnect,
  resetConsecutiveDisconnects,
  exchangeCardsBetweenUsers,
  DAILY_REWARD_LIMITS,
  MATCH_REWARDS,
  DAILY_LOGIN_GOLD,
  SURRENDER_GOLD_PENALTY,
  DISCONNECT_GOLD_PENALTY,
  DISCONNECT_PENALTY_THRESHOLD,
  PACK_PRICE_GOLD,
  PACK_SIZE,
  buyPack,
};
