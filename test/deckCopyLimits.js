const assert = require("assert");
const { CARDS } = require("../public/cards");
const { DECK_SIZE, cardCopyLimit, validateDeck } = require("../public/deckRules");

function cardByRarity(rarity) {
  const card = CARDS.find((entry) =>
    entry.showInInventory !== false &&
    entry.rarity === rarity
  );
  assert(card, `Fixture needs a ${rarity} card.`);
  return card;
}

function oversizedDeck(card) {
  return Array.from({ length: DECK_SIZE }, () => card.id);
}

function collectionFor(card) {
  return { cardCollection: { [card.id]: DECK_SIZE }, unlockedCards: [card.id] };
}

for (const rarity of ["common", "rare", "souvenir"]) {
  const card = cardByRarity(rarity);
  assert.strictEqual(cardCopyLimit(rarity), 2, `${rarity} cards should allow two copies.`);
  assert(
    validateDeck(oversizedDeck(card), collectionFor(card)).errors.includes(`${card.name}: max 2 copies.`),
    `${rarity} cards should reject a third copy.`
  );
}

const legendary = cardByRarity("legendary");
assert.strictEqual(cardCopyLimit("legendary"), 1, "Legendary cards should allow one copy per card.");
assert(
  validateDeck(oversizedDeck(legendary), collectionFor(legendary)).errors.includes(`${legendary.name}: max 1 copy.`),
  "Legendary cards should reject duplicate copies."
);

const mythic = cardByRarity("mythic");
assert.strictEqual(cardCopyLimit("mythic"), 1, "Mythic cards should allow one copy per card.");
assert(
  validateDeck(oversizedDeck(mythic), collectionFor(mythic)).errors.includes("mythic cards: max 1 total."),
  "Mythic cards should stay limited to one total per deck."
);

console.log("--- DECK COPY LIMITS TEST OK ---");
