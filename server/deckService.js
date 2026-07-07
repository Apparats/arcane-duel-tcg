const { buildAutoDeck, buildFallbackDeck, validateDeck, DECK_SIZE, CARD_COPY_LIMITS, RARITY_TOTAL_LIMITS } = require("../public/deckRules");
const { getDB } = require("./db");
const { assertMongoKeySegment, sanitizeString, toObjectId } = require("./mongoSafety");
const { withUserLock } = require("./userLocks");

function publicDeck(deck) {
  return {
    id: deck.id,
    name: deck.name,
    cardIds: deck.cardIds,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  };
}

function buildValidatedAutoDeck(user) {
  const collection = { cardCollection: user.cardCollection || {}, unlockedCards: user.unlockedCards || [] };
  const cardIds = buildAutoDeck(collection);
  const validation = validateDeck(cardIds, collection);
  if (!validation.ok) {
    const err = new Error(validation.errors.join(" "));
    err.code = "AUTO_DECK_FAILED";
    err.errors = validation.errors;
    throw err;
  }
  return cardIds;
}

async function getDeckState(userId) {
  const user = await getDB()
    .collection("users")
    .findOne(
      { _id: toObjectId(userId, "user id") },
      { projection: { decks: 1, activeDeckId: 1, cardCollection: 1, unlockedCards: 1 } }
    );
  if (!user) throw new Error("User not found.");

  return {
    decks: (user.decks || []).map(publicDeck),
    activeDeckId: user.activeDeckId || null,
    rules: { deckSize: DECK_SIZE, copyLimits: CARD_COPY_LIMITS, rarityTotalLimits: RARITY_TOTAL_LIMITS },
  };
}

async function saveDeck(userId, { id, name, cardIds }) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  return withUserLock(String(_id), async () => {
  const user = await users.findOne({ _id }, { projection: { decks: 1, cardCollection: 1, unlockedCards: 1 } });
  if (!user) throw new Error("User not found.");

  const safeCardIds = Array.isArray(cardIds) ? cardIds.map((cardId) => assertMongoKeySegment(cardId, "card id")) : cardIds;
  const validation = validateDeck(safeCardIds, { cardCollection: user.cardCollection || {}, unlockedCards: user.unlockedCards || [] });
  if (!validation.ok) {
    const err = new Error(validation.errors.join(" "));
    err.code = "INVALID_DECK";
    err.errors = validation.errors;
    throw err;
  }

  const now = new Date();
  const deckId = id ? assertMongoKeySegment(id, "deck id") : `deck_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const existing = user.decks || [];
  const previous = existing.find((deck) => deck.id === deckId);
  const deck = {
    id: deckId,
    name: sanitizeString(name, { label: "deck name", fallback: "My Deck", max: 32 }),
    cardIds: safeCardIds,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };
  const decks = previous ? existing.map((item) => (item.id === deckId ? deck : item)) : [...existing, deck];

  await users.updateOne(
    { _id },
    {
      $set: {
        decks,
        activeDeckId: deckId,
        updatedAt: now,
      },
    }
  );

  return { deck: publicDeck(deck), state: await getDeckState(userId) };
  });
}

async function autoBuildDeck(userId, { id, name } = {}) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  return withUserLock(String(_id), async () => {
  const user = await users.findOne({ _id }, { projection: { decks: 1, cardCollection: 1, unlockedCards: 1 } });
  if (!user) throw new Error("User not found.");

  const now = new Date();
  const deckId = id ? assertMongoKeySegment(id, "deck id") : `deck_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const existing = user.decks || [];
  const previous = existing.find((deck) => deck.id === deckId);
  const deck = {
    id: deckId,
    name: sanitizeString(name, { label: "deck name", fallback: "Auto Deck", max: 32 }),
    cardIds: buildValidatedAutoDeck(user),
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };
  const decks = previous ? existing.map((item) => (item.id === deckId ? deck : item)) : [...existing, deck];

  await users.updateOne(
    { _id },
    {
      $set: {
        decks,
        activeDeckId: deckId,
        updatedAt: now,
      },
    }
  );

  return { deck: publicDeck(deck), state: await getDeckState(userId) };
  });
}

async function activateDeck(userId, deckId) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  const safeDeckId = assertMongoKeySegment(deckId, "deck id");
  return withUserLock(String(_id), async () => {
  const user = await users.findOne({ _id }, { projection: { decks: 1 } });
  if (!user || !(user.decks || []).some((deck) => deck.id === safeDeckId)) {
    const err = new Error("Deck not found.");
    err.code = "DECK_NOT_FOUND";
    throw err;
  }
  await users.updateOne({ _id }, { $set: { activeDeckId: safeDeckId, updatedAt: new Date() } });
  return getDeckState(userId);
  });
}

async function getActiveDeckCardIds(userId) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  const user = await users.findOne({ _id }, { projection: { decks: 1, activeDeckId: 1, cardCollection: 1, unlockedCards: 1 } });
  const active = (user?.decks || []).find((deck) => deck.id === user.activeDeckId);
  if (active?.cardIds) return active.cardIds;

  return withUserLock(String(_id), async () => {
    const lockedUser = await users.findOne(
      { _id },
      { projection: { decks: 1, activeDeckId: 1, cardCollection: 1, unlockedCards: 1 } }
    );
    const lockedActive = (lockedUser?.decks || []).find((deck) => deck.id === lockedUser.activeDeckId);
    if (lockedActive?.cardIds) return lockedActive.cardIds;

    try {
      const cardIds = buildValidatedAutoDeck(lockedUser || {});
      const now = new Date();
      const deck = {
        id: `auto_${now.getTime().toString(36)}`,
        name: "Auto Deck",
        cardIds,
        createdAt: now,
        updatedAt: now,
      };
      await users.updateOne(
        { _id },
        {
          $set: {
            decks: [...(lockedUser?.decks || []), deck],
            activeDeckId: deck.id,
            updatedAt: now,
          },
        }
      );
      return cardIds;
    } catch (err) {
      return buildFallbackDeck();
    }
  });
}

module.exports = {
  getDeckState,
  saveDeck,
  autoBuildDeck,
  activateDeck,
  getActiveDeckCardIds,
};
