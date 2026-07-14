const { CARDS } = require("../public/cards");
const { CARD_COPY_LIMITS, DECK_SIZE, MAX_SPELLS, buildRandomLegalDeck, countSpellCards, validateDeck } = require("../public/deckRules");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return (maxExclusive) => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value % maxExclusive;
  };
}

const npcCollection = {
  cardCollection: Object.fromEntries(
    CARDS
      .filter((card) => card.showInInventory !== false)
      .map((card) => [card.id, CARD_COPY_LIMITS[card.rarity || "common"] || 2])
  ),
};

function main() {
  const decks = Array.from({ length: 24 }, (_, index) => buildRandomLegalDeck({
    randomInt: seededRandom(index + 1),
    includeCard: (card) => card.type === "minion",
  }));

  decks.forEach((deck, index) => {
    const validation = validateDeck(deck, npcCollection);
    assert(deck.length === DECK_SIZE, `NPC deck ${index} should have ${DECK_SIZE} cards.`);
    assert(validation.ok, `NPC deck ${index} should be legal: ${validation.errors.join(" ")}`);
    assert(countSpellCards(deck) <= MAX_SPELLS, `NPC deck ${index} should respect the spell limit.`);
    assert(deck.every((cardId) => CARDS.find((card) => card.id === cardId)?.type === "minion"), `NPC deck ${index} should not include spells.`);
  });

  assert(new Set(decks.map((deck) => deck.join("|"))).size > 1, "NPC deck generation should vary between matches.");
  console.log("--- RANDOM NPC DECK TEST OK ---");
}

main();
