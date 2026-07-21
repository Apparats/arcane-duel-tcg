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
const { getCardById } = require("../public/cards");
const { assertMongoKeySegment, assertPositiveInteger, sanitizeDiscordProfile, toObjectId } = require("./mongoSafety");
const { withUserLock, withUserLocks } = require("./userLocks");
const { getProgress } = require("../public/profileCatalog");

let client = null;
let db = null;
let connecting = null;

function readBoundedEnvInt(name, fallback, { min, max }) {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

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
    client = new MongoClient(process.env.MONGODB_URI, {
      // Atlas' driver default is generous for a small single-process game.
      // Keep this configurable while avoiding idle connection pressure on the VM.
      maxPoolSize: readBoundedEnvInt("MONGODB_MAX_POOL_SIZE", 10, { min: 2, max: 100 }),
    });
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || "arcane_duel");

    // Indexes are idempotent — safe to run every time the server boots.
    const cardRequests = db.collection("card_requests");
    const tournamentRewards = db.collection("tournament_rewards");
    // Migrate the early single-request index if this feature was deployed
    // before daily requests were introduced.
    try {
      await cardRequests.dropIndex("userId_1");
    } catch (err) {
      if (err?.codeName !== "IndexNotFound" && err?.code !== 27 && err?.code !== 26) throw err;
    }

    await Promise.all([
      db.collection("users").createIndex({ discordId: 1 }, { unique: true }),
      db.collection("users").createIndex({ username: 1 }),
      db.collection("users").createIndex({ displayName: 1 }),
      db.collection("users").createIndex({ "stats.quickplayWins": -1, _id: 1 }),
      cardRequests.createIndex({ userId: 1, requestDay: 1 }, { unique: true }),
      db.collection("tournaments").createIndex({ status: 1, updatedAt: -1 }),
      tournamentRewards.createIndex({ tournamentId: 1, place: 1 }, { unique: true }),
    ]);

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
        stats: { wins: 0, losses: 0, surrenders: 0, packsOpened: 0, quickplayWins: 0, campaignWins: 0, unchainedWins: 0, npcWins: 0, johnnyWins: 0, tournamentWins: 0 },
        modeStats: { singleplayer: { wins: 0, losses: 0, draws: 0, surrenders: 0 }, oneVsOne: { wins: 0, losses: 0, draws: 0, surrenders: 0 }, quickplay: { wins: 0, losses: 0, draws: 0, surrenders: 0 } },
        selectedTitle: "initiate",
        equippedBadgeIds: [],
        purchasedAchievementIds: [],
        purchasedTitleIds: [],
        supporter: false,
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

async function grantCampaignReward(userId, campaignId, rewards = {}) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  const safeCampaignId = assertMongoKeySegment(campaignId, "campaign id");
  const safeCardIds = Array.isArray(rewards.cards) ? rewards.cards.map((cardId) => assertMongoKeySegment(cardId, "card id")) : [];
  const rewardCount = safeCardIds.length > 0 ? rewards.count : 0;
  const rewardGold = Number.isInteger(rewards.gold) && rewards.gold >= 0 && rewards.gold <= 100000 ? rewards.gold : 0;
  const goldOnce = rewards.goldOnce === true;
  if (safeCardIds.length === 0 && rewardGold === 0) throw new Error("Campaign reward is invalid.");
  if (safeCardIds.length > 0 && (!Number.isInteger(rewardCount) || rewardCount < 1 || rewardCount > safeCardIds.length)) {
    throw new Error("Campaign reward count is invalid.");
  }

  return withUserLock(String(_id), async () => {
    const user = await users.findOne({ _id }, { projection: { cardCollection: 1, unlockedCards: 1, stats: 1, campaignProgress: 1, gold: 1 } });
    if (!user) throw new Error("User not found.");

    const rewardPool = safeCardIds.map((id) => getCardById(id));
    if (rewardPool.some((card) => !card)) throw new Error("Campaign reward contains an unknown card.");
    // Campaign card rewards are repeatable: every victory rolls only the configured
    // amount from its pool, so duplicates remain useful for trading.
    const opening = rewardPool.length > 0
      ? summarizeOpening(buildPackOpening(rewardPool, rewardCount), user.cardCollection || {})
      : { cards: [], collectionIncrements: {}, newCardIds: [] };
    const increments = Object.fromEntries(Object.entries(opening.collectionIncrements).map(([cardId, amount]) => [`cardCollection.${cardId}`, amount]));
    const campaignDrops = Object.fromEntries(Object.entries(opening.collectionIncrements).map(([cardId, amount]) => [`campaignProgress.${safeCampaignId}.cardDrops.${cardId}`, amount]));
    const goldAlreadyClaimed = goldOnce && user.campaignProgress?.[safeCampaignId]?.goldRewardClaimed === true;
    const goldAwarded = rewardGold > 0 && (!goldOnce || !goldAlreadyClaimed) ? rewardGold : 0;
    const updateIncrements = {
      ...increments,
      ...campaignDrops,
      "stats.campaignWins": 1,
      [`campaignProgress.${safeCampaignId}.wins`]: 1,
    };
    if (goldAwarded > 0) updateIncrements.gold = goldAwarded;
    const set = { updatedAt: new Date() };
    if (goldAwarded > 0 && goldOnce) set[`campaignProgress.${safeCampaignId}.goldRewardClaimed`] = true;
    await users.updateOne(
      { _id },
      {
        $inc: updateIncrements,
        $addToSet: { unlockedCards: { $each: opening.newCardIds } },
        $set: set,
      }
    );
    const updated = await users.findOne({ _id }, { projection: { cardCollection: 1, unlockedCards: 1, campaignProgress: 1, stats: 1, gold: 1 } });
    return {
      claimed: true,
      cards: opening.cards,
      cardCollection: updated.cardCollection || {},
      unlockedCards: updated.unlockedCards || [],
      cardDrops: updated.campaignProgress?.[safeCampaignId]?.cardDrops || {},
      campaignWins: updated.campaignProgress?.[safeCampaignId]?.wins || 0,
      stats: updated.stats || {},
      gold: updated.gold || 0,
      goldAwarded,
      goldAlreadyClaimed,
    };
  });
}

async function recordCampaignResult(userId, { result, surrendered = false, campaignId = null }) {
  if (!["win", "loss", "draw"].includes(result)) throw new Error("Invalid campaign result.");
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  const update = { $inc: {}, $set: { updatedAt: new Date() } };
  const modeField = "modeStats.singleplayer";

  if (result === "win") {
    update.$inc["stats.wins"] = 1;
    update.$inc[`${modeField}.wins`] = 1;
    if (campaignId === "iron-watch") update.$inc["stats.unchainedWins"] = 1;
  } else if (result === "loss") {
    update.$inc["stats.losses"] = 1;
    update.$inc[`${modeField}.losses`] = 1;
  }
  if (surrendered) {
    update.$inc["stats.surrenders"] = 1;
    update.$inc[`${modeField}.surrenders`] = 1;
  }

  const resultDoc = await users.findOneAndUpdate(
    { _id },
    update,
    { projection: { stats: 1, modeStats: 1 }, returnDocument: "after" }
  );
  const user = resultDoc?.value || resultDoc;
  if (!user) throw new Error("User not found.");
  return { stats: user.stats || {}, modeStats: user.modeStats || {} };
}

async function getCampaignProgress(userId) {
  const user = await getDB().collection("users").findOne(
    { _id: toObjectId(userId, "user id") },
    { projection: { campaignProgress: 1 } }
  );
  return user?.campaignProgress || {};
}

const DAILY_REWARD_LIMITS = {
  singleplayer: 80,
  multiplayer: 100,
};

const MATCH_REWARDS = {
  singleplayer: { win: 10, loss: 1 },
  multiplayer: { win: 10, loss: 4 },
};

const SURRENDER_GOLD_PENALTY = 10;
const DISCONNECT_GOLD_PENALTY = 20;
const DISCONNECT_PENALTY_THRESHOLD = 4;
const DAILY_LOGIN_GOLD = 50;
const PACK_PRICE_GOLD = 20;
const PACK_SIZE = 5;
const SCRAP_GOLD_VALUES = {
  common: 1,
  rare: 2,
  legendary: 3,
  mythic: 5,
  souvenir: 10,
};

function normalizeScrapeRarity(rarity) {
  return String(rarity || "common").trim().toLowerCase();
}

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

function assertCardCanBeTraded(user, cardId, incomingCardId = null) {
  assertMongoKeySegment(cardId, "card id");
  const owned = user?.cardCollection?.[cardId] || 0;
  if (owned <= 0) {
    const err = new Error("You do not own that card.");
    err.code = "CARD_NOT_OWNED";
    throw err;
  }

  const requiredByDeck = maxDeckUsage(user.decks || [], cardId);
  // Validate the collection after the atomic exchange, not after removing the
  // offered copy alone. Swapping identical cards leaves the available count
  // unchanged, so a legal saved deck must remain usable.
  const projectedOwned = owned - 1 + (incomingCardId === cardId ? 1 : 0);
  if (projectedOwned < requiredByDeck) {
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
        // The MongoDB driver does not allow concurrent operations on the same
        // session while a transaction is active. Keep these reads serial so a
        // trade remains atomic on Atlas without conflicting its transaction.
        const fromUser = await users.findOne(
          { _id: fromId },
          { session, projection: { cardCollection: 1, unlockedCards: 1, decks: 1 } }
        );
        const toUser = await users.findOne(
          { _id: toId },
          { session, projection: { cardCollection: 1, unlockedCards: 1, decks: 1 } }
        );
        if (!fromUser || !toUser) throw new Error("Trade user not found.");

        assertCardCanBeTraded(fromUser, safeFromCardId, safeToCardId);
        assertCardCanBeTraded(toUser, safeToCardId, safeFromCardId);

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

        const updatedFrom = await users.findOne(
          { _id: fromId },
          { session, projection: { cardCollection: 1, unlockedCards: 1 } }
        );
        const updatedTo = await users.findOne(
          { _id: toId },
          { session, projection: { cardCollection: 1, unlockedCards: 1 } }
        );

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

async function grantMatchEconomy(userId, { mode, result, surrendered = false, quickplay = false, johnnyWin = false }) {
  if (!["singleplayer", "multiplayer"].includes(mode)) throw new Error("Invalid economy mode.");
  if (!["win", "loss", "draw"].includes(result)) throw new Error("Invalid match result.");

  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  return withUserLock(String(_id), async () => {
  const now = new Date();
  const day = todayKey(now);
  const dailyField = `economy.dailyRewards.${day}.${mode}`;

  const user = await users.findOne({ _id }, { projection: { gold: 1, economy: 1, stats: 1, modeStats: 1 } });
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

  const statMode = mode === "singleplayer" ? "singleplayer" : quickplay ? "quickplay" : "oneVsOne";
  const modeStatField = `modeStats.${statMode}`;
  if (result === "win") update.$inc[`${modeStatField}.wins`] = 1;
  if (result === "loss") update.$inc[`${modeStatField}.losses`] = 1;
  if (result === "draw") update.$inc[`${modeStatField}.draws`] = 1;
  if (surrendered) update.$inc[`${modeStatField}.surrenders`] = 1;

  if (result === "win") update.$inc["stats.wins"] = 1;
  if (result === "win" && mode === "multiplayer" && quickplay) update.$inc["stats.quickplayWins"] = 1;
  if (result === "win" && mode === "singleplayer") update.$inc["stats.npcWins"] = 1;
  if (result === "win" && mode === "multiplayer" && johnnyWin) update.$inc["stats.johnnyWins"] = 1;
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
  const rankProgress = result === "win" && mode === "multiplayer" && quickplay
    ? await getQuickplayRankStateForUser(updated, { persistBest: true })
    : { quickplayRank: 0, bestQuickplayRank: updated?.stats?.bestQuickplayRank || 0 };

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
    modeStats: updated.modeStats || {},
    quickplayRank: rankProgress.quickplayRank,
    quickplayBestRank: rankProgress.bestQuickplayRank,
  };
  });
}

function normalizeScrapeRequests(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 300) {
    const err = new Error("Choose at least one duplicate card to scrape.");
    err.code = "SCRAPE_EMPTY";
    throw err;
  }

  const merged = new Map();
  items.forEach((item) => {
    const cardId = assertMongoKeySegment(item?.cardId, "card id");
    const quantity = assertPositiveInteger(item?.quantity, "scrape quantity", { min: 1, max: 1000 });
    const total = (merged.get(cardId) || 0) + quantity;
    if (total > 1000) {
      const err = new Error("Invalid scrape quantity.");
      err.code = "INVALID_INPUT";
      throw err;
    }
    merged.set(cardId, total);
  });
  return [...merged.entries()].map(([cardId, quantity]) => ({ cardId, quantity }));
}

function planScrapeDuplicateCards(user, items) {
  const requests = normalizeScrapeRequests(items);
  const plannedItems = [];
  let goldAwarded = 0;
  let totalCards = 0;

  requests.forEach(({ cardId, quantity }) => {
    const card = getCardById(cardId);
    if (!card || card.showInInventory === false) {
      const err = new Error("Unknown card.");
      err.code = "INVALID_ID";
      throw err;
    }

    const rarity = normalizeScrapeRarity(card.rarity);
    const goldEach = SCRAP_GOLD_VALUES[rarity];
    if (!goldEach) {
      const err = new Error(`${card.name} cannot be scraped.`);
      err.code = "CARD_NOT_SCRAPEABLE";
      throw err;
    }

    const owned = Math.max(0, Math.floor(Number(user?.cardCollection?.[cardId]) || 0));
    const minimumKept = Math.max(1, maxDeckUsage(user?.decks || [], cardId));
    const available = Math.max(0, owned - minimumKept);
    if (quantity > available) {
      const err = new Error(available > 0
        ? `You can scrape up to ${available} duplicate ${card.name} ${available === 1 ? "copy" : "copies"}.`
        : `${card.name} has no spare duplicate copies to scrape.`);
      err.code = available > 0 ? "SCRAPE_LIMIT" : owned <= 1 ? "CARD_NOT_DUPLICATE" : "CARD_LOCKED_BY_DECK";
      throw err;
    }

    plannedItems.push({
      cardId,
      name: card.name,
      rarity,
      quantity,
      goldEach,
      minimumKept,
      gold: quantity * goldEach,
    });
    goldAwarded += quantity * goldEach;
    totalCards += quantity;
  });

  if (goldAwarded <= 0 || totalCards <= 0) {
    const err = new Error("Choose at least one duplicate card to scrape.");
    err.code = "SCRAPE_EMPTY";
    throw err;
  }

  return { items: plannedItems, goldAwarded, totalCards };
}

async function scrapeDuplicateCards(userId, items) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  return withUserLock(String(_id), async () => {
    const user = await users.findOne(
      { _id },
      { projection: { gold: 1, cardCollection: 1, unlockedCards: 1, decks: 1 } }
    );
    if (!user) throw new Error("User not found.");

    const plan = planScrapeDuplicateCards(user, items);
    const inc = { gold: plan.goldAwarded };
    const filter = { _id };
    plan.items.forEach((item) => {
      inc[`cardCollection.${item.cardId}`] = -item.quantity;
      filter[`cardCollection.${item.cardId}`] = { $gte: item.quantity + item.minimumKept };
    });

    const now = new Date();
    const update = await users.updateOne(
      filter,
      {
        $inc: inc,
        $set: { updatedAt: now },
        $push: {
          scrapeHistory: {
            createdAt: now,
            goldAwarded: plan.goldAwarded,
            cards: plan.items.map((item) => ({
              cardId: item.cardId,
              quantity: item.quantity,
              goldEach: item.goldEach,
              gold: item.gold,
            })),
          },
        },
      }
    );

    if (update.modifiedCount !== 1) {
      const err = new Error("Those cards are no longer available to scrape.");
      err.code = "SCRAPE_LIMIT";
      throw err;
    }

    const updated = await users.findOne(
      { _id },
      { projection: { gold: 1, cardCollection: 1, unlockedCards: 1 } }
    );
    return {
      goldAwarded: plan.goldAwarded,
      totalCards: plan.totalCards,
      items: plan.items,
      gold: updated?.gold || 0,
      cardCollection: updated?.cardCollection || {},
      unlockedCards: updated?.unlockedCards || [],
    };
  });
}

async function grantTournamentPrize(userId, { tournamentId, place, gold }) {
  if (typeof tournamentId !== "string" || !/^[a-z0-9-]{3,80}$/i.test(tournamentId)) throw new Error("Invalid tournament.");
  if (!["first", "second", "third"].includes(place)) throw new Error("Invalid tournament placing.");
  const amount = Math.max(0, Math.floor(Number(gold) || 0));
  if (amount <= 0) throw new Error("Invalid tournament prize.");

  const users = getDB().collection("users");
  const rewards = getDB().collection("tournament_rewards");
  const _id = toObjectId(userId, "user id");
  try {
    await rewards.insertOne({ tournamentId, place, userId: _id, gold: amount, createdAt: new Date() });
  } catch (err) {
    if (err?.code !== 11000) throw err;
    const user = await users.findOne({ _id }, { projection: { gold: 1, stats: 1 } });
    return { awarded: false, gold: user?.gold || 0, stats: user?.stats || {} };
  }

  const increments = { gold: amount };
  if (place === "first") increments["stats.tournamentWins"] = 1;
  await users.updateOne({ _id }, { $inc: increments, $set: { updatedAt: new Date() } });
  const user = await users.findOne({ _id }, { projection: { gold: 1, stats: 1 } });
  return { awarded: true, gold: user?.gold || 0, stats: user?.stats || {} };
}

function publicRankingPlayer(user, rank) {
  return {
    rank,
    username: playerDisplayName(user),
    wins: user.stats?.quickplayWins || 0,
    avatarUrl: user.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : null,
    userId: String(user._id),
  };
}

function playerDisplayName(user) {
  return user.displayName || user.username || "Player";
}

function normalizeDisplayName(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_]{1,24}$/.test(value)) {
    throw new Error("Username must use 1 to 24 letters, numbers, or underscores only (no spaces).");
  }
  return value;
}

function normalizedPublicStats(stats = {}) {
  return {
    wins: Math.max(0, stats.wins || 0),
    losses: Math.max(0, stats.losses || 0),
    surrenders: Math.max(0, stats.surrenders || 0),
    quickplayWins: Math.max(0, stats.quickplayWins || 0),
    packsOpened: Math.max(0, stats.packsOpened || 0),
    campaignWins: Math.max(0, stats.campaignWins || 0),
    unchainedWins: Math.max(0, stats.unchainedWins || 0),
    npcWins: Math.max(0, stats.npcWins || 0),
    johnnyWins: Math.max(0, stats.johnnyWins || 0),
    tournamentWins: Math.max(0, stats.tournamentWins || 0),
  };
}

function normalizedModeStats(modeStats = {}, legacyStats = {}) {
  const normalize = (stats = {}) => ({
    wins: Math.max(0, stats.wins || 0),
    losses: Math.max(0, stats.losses || 0),
    draws: Math.max(0, stats.draws || 0),
    surrenders: Math.max(0, stats.surrenders || 0),
  });
  const singleplayer = normalize(modeStats.singleplayer);
  const oneVsOne = normalize(modeStats.oneVsOne);
  const quickplay = normalize(modeStats.quickplay);
  const allModes = [singleplayer, oneVsOne, quickplay];
  const total = (field) => allModes.reduce((sum, stats) => sum + stats[field], 0);

  // Mode-specific stats were added after the global record. Keep those older
  // matches visible by assigning only the unclassified remainder to Quickplay.
  quickplay.wins += Math.max(0, (legacyStats.wins || 0) - total("wins"), (legacyStats.quickplayWins || 0) - quickplay.wins);
  quickplay.losses += Math.max(0, (legacyStats.losses || 0) - total("losses"));
  quickplay.surrenders += Math.max(0, (legacyStats.surrenders || 0) - total("surrenders"));
  return { singleplayer, oneVsOne, quickplay };
}

function publicPlayerProfile(user, options = {}) {
  const supporter = user.supporter === true;
  const quickplayRank = Math.max(0, Number(options.quickplayRank ?? user.quickplayRank) || 0);
  const bestQuickplayRank = Math.max(0, Number(options.bestQuickplayRank ?? user.stats?.bestQuickplayRank ?? user.quickplayBestRank) || 0);
  const progressOptions = {
    supporter,
    cardCollection: user.cardCollection,
    unlockedCards: user.unlockedCards,
    purchasedAchievementIds: user.purchasedAchievementIds,
    purchasedTitleIds: user.purchasedTitleIds,
    quickplayRank,
    bestQuickplayRank,
  };
  const progress = getProgress(user.stats, user.selectedTitle, user.equippedBadgeIds, progressOptions);
  return {
    id: String(user._id),
    username: playerDisplayName(user),
    avatarUrl: user.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : null,
    stats: normalizedPublicStats(progress.stats),
    modeStats: normalizedModeStats(user.modeStats, user.stats),
    selectedTitle: progress.selectedTitle,
    achievements: progress.achievements,
    titles: progress.titles,
    equippedBadges: progress.equippedBadges,
    quickplayRank,
    quickplayBestRank: bestQuickplayRank,
    cardCollection: user.cardCollection || {},
    unlockedCards: user.unlockedCards || [],
    purchasedAchievementIds: user.purchasedAchievementIds || [],
    purchasedTitleIds: user.purchasedTitleIds || [],
    supporter,
    createdAt: user.createdAt || null,
  };
}

async function getQuickplayRankForUser(user) {
  const wins = Math.max(0, user?.stats?.quickplayWins || 0);
  if (wins <= 0 || !user?._id) return 0;
  const users = getDB().collection("users");
  const playersAhead = await users.countDocuments({
    $or: [
      { "stats.quickplayWins": { $gt: wins } },
      { "stats.quickplayWins": wins, _id: { $lt: user._id } },
    ],
  });
  return playersAhead + 1;
}

async function getQuickplayRankStateForUser(user, { persistBest = false } = {}) {
  const quickplayRank = await getQuickplayRankForUser(user);
  const previousBest = Math.max(0, user?.stats?.bestQuickplayRank || 0);
  const bestQuickplayRank = quickplayRank > 0
    ? previousBest > 0 ? Math.min(previousBest, quickplayRank) : quickplayRank
    : previousBest;
  if (persistBest && bestQuickplayRank > 0 && bestQuickplayRank !== previousBest) {
    await getDB().collection("users").updateOne(
      { _id: user._id },
      { $set: { "stats.bestQuickplayRank": bestQuickplayRank, updatedAt: new Date() } }
    );
    user.stats = { ...(user.stats || {}), bestQuickplayRank };
  }
  return { quickplayRank, bestQuickplayRank };
}

async function setDisplayName(userId, displayNameInput) {
  const displayName = normalizeDisplayName(displayNameInput);
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  const user = await users.findOneAndUpdate(
    { _id },
    { $set: { displayName, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!user) throw new Error("User not found.");
  return publicPlayerProfile(user, await getQuickplayRankStateForUser(user, { persistBest: true }));
}

async function setEquippedBadges(userId, achievementIds) {
  if (!Array.isArray(achievementIds) || achievementIds.length > 3 || achievementIds.some((id) => typeof id !== "string")) {
    throw new Error("Choose up to three achievement badges.");
  }
  const ids = [...new Set(achievementIds)];
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  const user = await users.findOne({ _id });
  if (!user) throw new Error("User not found.");
  const rankProgress = await getQuickplayRankStateForUser(user, { persistBest: true });
  const progress = getProgress(user.stats, user.selectedTitle, ids, {
    supporter: user.supporter === true,
    cardCollection: user.cardCollection,
    unlockedCards: user.unlockedCards,
    purchasedAchievementIds: user.purchasedAchievementIds,
    purchasedTitleIds: user.purchasedTitleIds,
    quickplayRank: rankProgress.quickplayRank,
    bestQuickplayRank: rankProgress.bestQuickplayRank,
  });
  if (progress.equippedBadges.length !== ids.length) throw new Error("Only unlocked achievement badges can be equipped.");
  await users.updateOne({ _id }, { $set: { equippedBadgeIds: ids } });
  return publicPlayerProfile({ ...user, equippedBadgeIds: ids }, rankProgress);
}

async function setSelectedTitle(userId, titleId) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  const user = await users.findOne({ _id });
  if (!user) throw new Error("User not found.");

  const rankProgress = await getQuickplayRankStateForUser(user, { persistBest: true });
  const progress = getProgress(user.stats, titleId, user.equippedBadgeIds, {
    supporter: user.supporter === true,
    cardCollection: user.cardCollection,
    unlockedCards: user.unlockedCards,
    purchasedAchievementIds: user.purchasedAchievementIds,
    purchasedTitleIds: user.purchasedTitleIds,
    quickplayRank: rankProgress.quickplayRank,
    bestQuickplayRank: rankProgress.bestQuickplayRank,
  });
  const requested = progress.titles.find((title) => title.id === titleId);
  if (!requested) throw new Error("Unknown title.");
  if (!requested.unlocked) throw new Error("That title has not been unlocked yet.");

  await users.updateOne({ _id }, { $set: { selectedTitle: requested.id } });
  return publicPlayerProfile({ ...user, selectedTitle: requested.id }, rankProgress);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePlayerSearchQuery(query) {
  if (typeof query !== "string") return "";
  return query.trim().replace(/\s+/g, " ").slice(0, 40);
}

async function searchPublicPlayers(query, limit = 8) {
  const search = normalizePlayerSearchQuery(query);
  if (search.length < 2) return [];

  const safeLimit = Math.max(1, Math.min(Number.isInteger(limit) ? limit : 8, 12));
  const regex = new RegExp(escapeRegex(search), "i");
  const projection = { username: 1, displayName: 1, discordUsername: 1, avatar: 1, discordId: 1, stats: 1, modeStats: 1, selectedTitle: 1, equippedBadgeIds: 1, purchasedAchievementIds: 1, purchasedTitleIds: 1, supporter: 1, cardCollection: 1, unlockedCards: 1, createdAt: 1 };
  const users = await getDB()
    .collection("users")
    .find({ $or: [{ displayName: regex }, { username: regex }, { discordUsername: regex }] }, { projection })
    .sort({ "stats.quickplayWins": -1, displayName: 1, username: 1, _id: 1 })
    .limit(safeLimit)
    .toArray();

  const ranks = await Promise.all(users.map((user) => getQuickplayRankStateForUser(user)));
  return users.map((user, index) => publicPlayerProfile(user, ranks[index]));
}

async function getPublicPlayerProfile(userId) {
  const user = await getDB()
    .collection("users")
    .findOne(
      { _id: toObjectId(userId, "user id") },
      { projection: { username: 1, displayName: 1, avatar: 1, discordId: 1, stats: 1, modeStats: 1, selectedTitle: 1, equippedBadgeIds: 1, purchasedAchievementIds: 1, purchasedTitleIds: 1, supporter: 1, cardCollection: 1, unlockedCards: 1, createdAt: 1 } }
    );
  return user ? publicPlayerProfile(user, await getQuickplayRankStateForUser(user, { persistBest: true })) : null;
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
  const safeLimit = Math.max(1, Math.min(Number.isInteger(limit) ? limit : 50, 50));
  const projection = { username: 1, displayName: 1, avatar: 1, discordId: 1, stats: 1 };
  const sort = { "stats.quickplayWins": -1, _id: 1 };
  const [topPlayers, currentUser] = await Promise.all([
    users.find({ "stats.quickplayWins": { $gt: 0 } }, { projection }).sort(sort).limit(safeLimit).toArray(),
    users.findOne({ _id: toObjectId(userId, "user id") }, { projection }),
  ]);

  const players = topPlayers.map((player, index) => publicRankingPlayer(player, index + 1));
  const wins = currentUser?.stats?.quickplayWins || 0;
  if (wins <= 0 || players.some((player) => player.userId === String(userId))) {
    return { players, currentPlayer: null };
  }

  const playersAhead = await users.countDocuments({
    $or: [
      { "stats.quickplayWins": { $gt: wins } },
      { "stats.quickplayWins": wins, _id: { $lt: currentUser._id } },
    ],
  });
  return {
    players,
    currentPlayer: publicRankingPlayer(currentUser, playersAhead + 1),
  };
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

async function buyShopItem(userId, item) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  return withUserLock(String(_id), async () => {
    const now = new Date();
    const priceGold = assertPositiveInteger(item.priceGold, "item price", { min: 1, max: 100000 });
    const unlockField = item.type === "achievement" ? "purchasedAchievementIds" : item.type === "title" ? "purchasedTitleIds" : null;
    const unlockId = item.type === "achievement" ? item.achievementId : item.type === "title" ? item.titleId : null;
    if (!unlockField || !unlockId) throw new Error("Shop item is invalid.");
    const safeUnlockId = assertMongoKeySegment(unlockId, "shop unlock id");

    const purchase = await users.updateOne(
      { _id, gold: { $gte: priceGold }, [unlockField]: { $ne: safeUnlockId } },
      {
        $inc: { gold: -priceGold },
        $addToSet: { [unlockField]: safeUnlockId },
        $set: { updatedAt: now },
        $push: {
          shopHistory: {
            createdAt: now,
            itemId: item.id,
            type: item.type,
            unlockId: safeUnlockId,
            cost: priceGold,
          },
        },
      }
    );

    if (purchase.modifiedCount !== 1) {
      const user = await users.findOne({ _id }, { projection: { gold: 1, [unlockField]: 1 } });
      if (!user) throw new Error("User not found.");
      if ((user[unlockField] || []).includes(safeUnlockId)) {
        const err = new Error("You already own this item.");
        err.code = "SHOP_ITEM_OWNED";
        throw err;
      }
      const err = new Error(`Not enough gold. This item costs ${priceGold} gold.`);
      err.code = "NOT_ENOUGH_GOLD";
      throw err;
    }

    const updated = await users.findOne({ _id });
    const rankProgress = await getQuickplayRankStateForUser(updated, { persistBest: true });
    return {
      item: {
        id: item.id,
        type: item.type,
        achievementId: item.achievementId,
        titleId: item.titleId,
        name: item.name,
        cost: priceGold,
      },
      gold: updated.gold || 0,
      user: {
        ...publicPlayerProfile(updated, rankProgress),
        gold: updated.gold || 0,
        economy: {
          dailyRewards: getDailyRewardProgress(updated),
        },
        warnings: updated.warnings || [],
      },
    };
  });
}

function normalizeWareraName(value) {
  if (typeof value !== "string") throw new Error("Enter your Warera name.");
  const wareraName = value.trim().replace(/\s+/g, " ");
  if (wareraName.length < 2 || wareraName.length > 48) {
    throw new Error("Warera names must be between 2 and 48 characters.");
  }
  if (/[\u0000-\u001F\u007F]/.test(wareraName)) throw new Error("That Warera name is not valid.");
  return wareraName;
}

async function submitCardRequest(userId, wareraNameInput) {
  const userIdObject = toObjectId(userId, "user id");
  const wareraName = normalizeWareraName(wareraNameInput);
  const now = new Date();
  const requestDay = now.toISOString().slice(0, 10);
  try {
    await getDB().collection("card_requests").insertOne({
      userId: userIdObject,
      requestDay,
      wareraName,
      status: "pending",
      createdAt: now,
    });
  } catch (err) {
    if (err?.code === 11000) {
      const limitError = new Error("You can submit one card request per day.");
      limitError.code = "CARD_REQUEST_DAILY_LIMIT";
      throw limitError;
    }
    throw err;
  }
  return { wareraName };
}

module.exports = {
  isDbEnabled,
  connectDB,
  getDB,
  closeDB,
  findOrCreateUserFromDiscord,
  findUserById,
  consumePendingRewards,
  grantCampaignReward,
  recordCampaignResult,
  getCampaignProgress,
  getDailyRewardProgress,
  grantDailyLoginReward,
  grantMatchEconomy,
  grantTournamentPrize,
  getQuickplayRanking,
  getPublicPlayerProfile,
  setDisplayName,
  setSelectedTitle,
  setEquippedBadges,
  rankQuickplayPlayers,
  recordMultiplayerDisconnect,
  searchPublicPlayers,
  resetConsecutiveDisconnects,
  exchangeCardsBetweenUsers,
  assertCardCanBeTraded,
  DAILY_REWARD_LIMITS,
  MATCH_REWARDS,
  DAILY_LOGIN_GOLD,
  SURRENDER_GOLD_PENALTY,
  DISCONNECT_GOLD_PENALTY,
  DISCONNECT_PENALTY_THRESHOLD,
  PACK_PRICE_GOLD,
  PACK_SIZE,
  SCRAP_GOLD_VALUES,
  buyPack,
  buyShopItem,
  planScrapeDuplicateCards,
  scrapeDuplicateCards,
  submitCardRequest,
  normalizeDisplayName,
};
