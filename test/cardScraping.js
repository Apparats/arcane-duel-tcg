const assert = require("assert");
const { planScrapeDuplicateCards, SCRAP_GOLD_VALUES } = require("../server/db");
const { getCardById } = require("../public/cards");

assert.deepStrictEqual(
  SCRAP_GOLD_VALUES,
  { common: 1, rare: 1, legendary: 2, mythic: 3, souvenir: 10 },
  "Scrap gold values should match the economy table."
);

{
  const user = {
    cardCollection: {
      "base:aleex": 3,
      "base:dog": 2,
      "base:bloodgiver": 2,
      "base:humph": 2,
      "expansion2:vatou": 2,
    },
    decks: [{ cardIds: ["base:aleex", "base:aleex"] }],
  };
  const plan = planScrapeDuplicateCards(user, [
    { cardId: "base:aleex", quantity: 1 },
    { cardId: "base:dog", quantity: 1 },
    { cardId: "base:bloodgiver", quantity: 1 },
    { cardId: "base:humph", quantity: 1 },
    { cardId: "expansion2:vatou", quantity: 1 },
  ]);
  assert.strictEqual(plan.totalCards, 5, "Scraping should count all selected copies.");
  assert.strictEqual(plan.goldAwarded, 17, "Scraping should pay by rarity.");
}

{
  const vatou = getCardById("expansion2:vatou");
  const originalRarity = vatou.rarity;
  try {
    vatou.rarity = " Souvenir ";
    const plan = planScrapeDuplicateCards(
      { cardCollection: { "expansion2:vatou": 2 }, decks: [] },
      [{ cardId: "expansion2:vatou", quantity: 1 }]
    );
    assert.strictEqual(plan.goldAwarded, 10, "Souvenir scraping should tolerate rarity casing and whitespace.");
  } finally {
    vatou.rarity = originalRarity;
  }
}

assert.throws(
  () => planScrapeDuplicateCards({ cardCollection: { "base:aleex": 1 }, decks: [] }, [{ cardId: "base:aleex", quantity: 1 }]),
  /no spare duplicate copies/,
  "A single owned copy must not be scrapeable."
);

assert.throws(
  () => planScrapeDuplicateCards({ cardCollection: { "base:aleex": 2 }, decks: [{ cardIds: ["base:aleex", "base:aleex"] }] }, [{ cardId: "base:aleex", quantity: 1 }]),
  /no spare duplicate copies/,
  "Copies needed by saved decks must not be scrapeable."
);

console.log("--- CARD SCRAPING TEST OK ---");
