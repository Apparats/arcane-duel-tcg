const { DECK_SIZE, validateDeck, getOwnedCount } = require("../public/deckRules");
const { getCardById } = require("../public/cards");
const { secureRandomInt } = require("./random");

function deckSizeErrors(errors) {
  return errors.filter((error) => error.includes(`exactly ${DECK_SIZE} cards`));
}

function nonSizeErrors(errors) {
  return errors.filter((error) => !error.includes(`exactly ${DECK_SIZE} cards`));
}

function cloneCollection(user = {}) {
  return {
    cardCollection: { ...(user.cardCollection || {}) },
    unlockedCards: [...(user.unlockedCards || [])],
  };
}

function ownedCardIds(collection) {
  const ids = new Set([
    ...Object.keys(collection.cardCollection || {}),
    ...(collection.unlockedCards || []),
  ]);
  return [...ids].filter((cardId) => {
    const card = getCardById(cardId);
    return card && card.showInInventory !== false && getOwnedCount(collection, cardId) > 0;
  });
}

function collectionOwningDeck(collection, cardIds) {
  const nextCollection = {
    cardCollection: { ...(collection.cardCollection || {}) },
    unlockedCards: [...(collection.unlockedCards || [])],
  };
  cardIds.forEach((cardId) => {
    const used = cardIds.filter((id) => id === cardId).length;
    const owned = getOwnedCount(nextCollection, cardId);
    if (used > owned) nextCollection.cardCollection[cardId] = used;
  });
  return nextCollection;
}

function shuffled(items, randomInt = secureRandomInt) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function legalCandidateIds(deck, collection, randomInt) {
  return shuffled(ownedCardIds(collection), randomInt).filter((cardId) => {
    const nextDeck = [...deck, cardId];
    const candidateCollection = collectionOwningDeck(collection, nextDeck);
    return nonSizeErrors(validateDeck(nextDeck, candidateCollection).errors).length === 0;
  });
}

function completeDeckFromInventory(cardIds, collection, { randomInt = secureRandomInt } = {}) {
  const deck = [...(cardIds || [])];
  let nextCollection = cloneCollection(collection);
  const initialValidation = validateDeck(deck, nextCollection);
  if (initialValidation.ok) return { ok: true, cardIds: deck, collection: nextCollection, addedCardIds: [] };
  if (deck.length >= DECK_SIZE || nonSizeErrors(initialValidation.errors).length > 0 || deckSizeErrors(initialValidation.errors).length === 0) {
    return { ok: false, cardIds: deck, collection: nextCollection, addedCardIds: [], errors: initialValidation.errors };
  }

  const addedCardIds = [];
  while (deck.length < DECK_SIZE) {
    const candidates = legalCandidateIds(deck, nextCollection, randomInt);
    if (candidates.length === 0) {
      return {
        ok: false,
        cardIds: deck,
        collection: nextCollection,
        addedCardIds,
        errors: validateDeck(deck, nextCollection).errors,
      };
    }
    const cardId = candidates[0];
    deck.push(cardId);
    addedCardIds.push(cardId);
    nextCollection = collectionOwningDeck(nextCollection, deck);
  }

  const validation = validateDeck(deck, nextCollection);
  return {
    ok: validation.ok,
    cardIds: deck,
    collection: nextCollection,
    addedCardIds,
    errors: validation.errors,
  };
}

function migrateUserDecksToCurrentSize(user, { now = new Date(), randomInt = secureRandomInt } = {}) {
  const decks = Array.isArray(user?.decks) ? user.decks : [];
  if (decks.length === 0) return { changed: false, decks, collection: cloneCollection(user), updatedDecks: [] };

  let collection = cloneCollection(user);
  const updatedDecks = [];
  const nextDecks = decks.map((deck) => {
    const cardIds = Array.isArray(deck.cardIds) ? deck.cardIds : [];
    const validation = validateDeck(cardIds, collection);
    if (validation.ok || cardIds.length >= DECK_SIZE || nonSizeErrors(validation.errors).length > 0) return deck;

    const completed = completeDeckFromInventory(cardIds, collection, { randomInt });
    if (!completed.ok) return deck;

    collection = completed.collection;
    updatedDecks.push({
      id: deck.id,
      addedCardIds: completed.addedCardIds,
    });
    return {
      ...deck,
      cardIds: completed.cardIds,
      updatedAt: now,
    };
  });

  return {
    changed: updatedDecks.length > 0,
    decks: nextDecks,
    collection,
    updatedDecks,
  };
}

async function migrateDecksToCurrentSize(db, { now = new Date(), randomInt = secureRandomInt } = {}) {
  const users = db.collection("users");
  const cursor = users.find(
    { "decks.cardIds": { $exists: true } },
    { projection: { decks: 1, cardCollection: 1, unlockedCards: 1 } }
  );
  let migratedUsers = 0;
  let migratedDecks = 0;

  while (await cursor.hasNext()) {
    const user = await cursor.next();
    const migration = migrateUserDecksToCurrentSize(user, { now, randomInt });
    if (!migration.changed) continue;

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          decks: migration.decks,
          cardCollection: migration.collection.cardCollection,
          unlockedCards: migration.collection.unlockedCards,
          updatedAt: now,
          deckSizeMigration: {
            deckSize: DECK_SIZE,
            migratedAt: now,
            updatedDecks: migration.updatedDecks.map((deck) => ({
              id: deck.id,
              added: deck.addedCardIds.length,
            })),
          },
        },
      }
    );
    migratedUsers += 1;
    migratedDecks += migration.updatedDecks.length;
  }

  return { migratedUsers, migratedDecks };
}

module.exports = {
  completeDeckFromInventory,
  migrateDecksToCurrentSize,
  migrateUserDecksToCurrentSize,
};
