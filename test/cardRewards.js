const { buildPackOpening, buildStarterOpening, summarizeOpening } = require("../server/cardRewards");
const { getStarterCardPool } = require("../server/shopCatalog");
const { buildAutoDeck, validateDeck } = require("../public/deckRules");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function rarityCounts(cards) {
  return cards.reduce((counts, card) => {
    const rarity = card.rarity || "common";
    counts[rarity] = (counts[rarity] || 0) + 1;
    return counts;
  }, {});
}

function main() {
  const pool = getStarterCardPool();
  assert(pool.some((card) => card.rarity === "mythic"), "Starter pool needs a mythic card.");

  for (let run = 0; run < 100; run += 1) {
    const starter = buildStarterOpening(pool);
    const counts = rarityCounts(starter);
    assert(starter.length === 20, "Starter opening must contain 20 cards.");
    assert(counts.mythic === 1, "Starter opening must contain exactly one mythic.");
    assert((counts.legendary || 0) <= 3, "Starter opening must stay within the legendary deck limit.");

    const summary = summarizeOpening(starter);
    const deck = buildAutoDeck({ cardCollection: summary.collectionIncrements, unlockedCards: summary.newCardIds });
    assert(validateDeck(deck, { cardCollection: summary.collectionIncrements, unlockedCards: summary.newCardIds }).ok, "Starter cards must form a legal deck.");
  }

  const packCounts = {};
  const draws = 10_000;
  for (let index = 0; index < draws; index += 1) {
    const [card] = buildPackOpening(pool, 1);
    const rarity = card.rarity || "common";
    packCounts[rarity] = (packCounts[rarity] || 0) + 1;
  }
  const mythicRate = (packCounts.mythic || 0) / draws;
  const legendaryRate = (packCounts.legendary || 0) / draws;
  assert(mythicRate > 0.01 && mythicRate < 0.03, "Mythic pack rate should stay near 2%.");
  assert(legendaryRate > 0.06 && legendaryRate < 0.1, "Legendary pack rate should stay near 8%.");
  console.log("--- CARD REWARDS TEST OK ---");
}

main();
