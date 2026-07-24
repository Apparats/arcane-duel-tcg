const { buildAutoDeck, validateDeck, DECK_SIZE, MAX_SPELLS, CARD_COPY_LIMITS, RARITY_TOTAL_LIMITS } = require("../public/deckRules");
const { getDB } = require("./db");
const { assertMongoKeySegment, sanitizeString, toObjectId } = require("./mongoSafety");
const { withUserLock } = require("./userLocks");
const { secureRandomId } = require("./random");

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

function validActiveDeck(user) {
  const active = (user?.decks || []).find((deck) => deck.id === user.activeDeckId);
  if (!active?.cardIds) return null;
  const collection = { cardCollection: user.cardCollection || {}, unlockedCards: user.unlockedCards || [] };
  return validateDeck(active.cardIds, collection).ok ? active.cardIds : null;
}

function makeDeckId(prefix) {
  return `${prefix}_${secureRandomId(12)}`;
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
    rules: { deckSize: DECK_SIZE, spellLimit: MAX_SPELLS, copyLimits: CARD_COPY_LIMITS, rarityTotalLimits: RARITY_TOTAL_LIMITS },
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
  const deckId = id ? assertMongoKeySegment(id, "deck id") : makeDeckId("deck");
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
  const deckId = id ? assertMongoKeySegment(id, "deck id") : makeDeckId("deck");
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

async function deleteDeck(userId, deckId) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  const safeDeckId = assertMongoKeySegment(deckId, "deck id");

  return withUserLock(String(_id), async () => {
    const user = await users.findOne({ _id }, { projection: { decks: 1, activeDeckId: 1 } });
    const decks = user?.decks || [];
    if (!user || !decks.some((deck) => deck.id === safeDeckId)) {
      const err = new Error("Deck not found.");
      err.code = "DECK_NOT_FOUND";
      throw err;
    }
    if (decks.length <= 1) {
      const err = new Error("You must keep at least one deck.");
      err.code = "LAST_DECK";
      throw err;
    }

    const remainingDecks = decks.filter((deck) => deck.id !== safeDeckId);
    const activeDeckId = user.activeDeckId === safeDeckId ? remainingDecks[0].id : user.activeDeckId;
    await users.updateOne(
      { _id },
      { $set: { decks: remainingDecks, activeDeckId, updatedAt: new Date() } }
    );
    return getDeckState(userId);
  });
}

async function getActiveDeckCardIds(userId) {
  const users = getDB().collection("users");
  const _id = toObjectId(userId, "user id");
  const user = await users.findOne({ _id }, { projection: { decks: 1, activeDeckId: 1, cardCollection: 1, unlockedCards: 1 } });
  const activeCardIds = validActiveDeck(user);
  if (activeCardIds) return activeCardIds;

  return withUserLock(String(_id), async () => {
    const lockedUser = await users.findOne(
      { _id },
      { projection: { decks: 1, activeDeckId: 1, cardCollection: 1, unlockedCards: 1 } }
    );
    const lockedActiveCardIds = validActiveDeck(lockedUser);
    if (lockedActiveCardIds) return lockedActiveCardIds;

    try {
      const cardIds = buildValidatedAutoDeck(lockedUser || {});
      const now = new Date();
      const deck = {
        id: makeDeckId("auto"),
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
      const safeError = new Error(`A valid ${DECK_SIZE}-card deck is required before starting a match.`);
      safeError.code = "VALID_DECK_REQUIRED";
      throw safeError;
    }
  });
}

module.exports = {
  getDeckState,
  saveDeck,
  autoBuildDeck,
  activateDeck,
  deleteDeck,
  getActiveDeckCardIds,
};
