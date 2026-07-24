const assert = require("assert");
const { CARDS } = require("../public/cards");
const { DECK_SIZE, validateDeck } = require("../public/deckRules");
const { migrateUserDecksToCurrentSize } = require("../server/deckMigration");

function main() {
  const oldDeck = CARDS
    .filter((card) =>
      card.showInInventory !== false &&
      card.type !== "spell" &&
      ["common", "rare"].includes(card.rarity || "common")
    )
    .slice(0, 20)
    .map((card) => card.id);
  assert.strictEqual(oldDeck.length, 20, "Fixture needs a legacy 20-card deck.");

  const user = {
    cardCollection: Object.fromEntries(oldDeck.map((cardId) => [cardId, 1])),
    unlockedCards: oldDeck,
    decks: [{
      id: "legacy",
      name: "Legacy Deck",
      cardIds: oldDeck,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    }],
  };

  const migrated = migrateUserDecksToCurrentSize(user, {
    now: new Date("2026-07-23T00:00:00.000Z"),
    randomInt: () => 0,
  });
  assert.strictEqual(migrated.changed, true, "Legacy decks should be migrated.");
  assert.strictEqual(migrated.decks[0].cardIds.length, DECK_SIZE, "Migrated deck should have the current deck size.");
  assert.strictEqual(migrated.updatedDecks[0].addedCardIds.length, DECK_SIZE - oldDeck.length, "Migration should add only the missing cards.");
  assert(
    validateDeck(migrated.decks[0].cardIds, migrated.collection).ok,
    "Migrated deck should remain valid against the migrated collection."
  );

  const repeated = migrateUserDecksToCurrentSize({
    ...user,
    cardCollection: migrated.collection.cardCollection,
    unlockedCards: migrated.collection.unlockedCards,
    decks: migrated.decks,
  });
  assert.strictEqual(repeated.changed, false, "Migration should be idempotent once the deck is valid.");

  console.log("--- DECK SIZE MIGRATION TEST OK ---");
}

main();
