const { buildPackOpening, buildStarterOpening, summarizeOpening, PACK_RARITY_WEIGHTS, STARTER_CARD_COUNT } = require("../server/cardRewards");
const { getStarterCardPool } = require("../server/shopCatalog");
const { DECK_SIZE, buildAutoDeck, validateDeck } = require("../public/deckRules");
const { CARDS } = require("../public/cards");

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
  assert(PACK_RARITY_WEIGHTS.souvenir === 0.6, "Souvenir pack weight must be exactly 0.6%.");

  for (let run = 0; run < 100; run += 1) {
    const starter = buildStarterOpening(pool);
    const counts = rarityCounts(starter);
    assert(starter.length === STARTER_CARD_COUNT, `Starter opening must contain ${STARTER_CARD_COUNT} cards.`);
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

  const souvenirFixture = {
    id: "test:souvenir",
    name: "Test Souvenir",
    cost: 1,
    type: "minion",
    attack: 1,
    health: 1,
    keywords: [],
    race: "Memory",
    rarity: "souvenir",
    country: "Arcana",
    lore: "A controlled test souvenir.",
  };
  CARDS.push(souvenirFixture);
  try {
    const souvenirCollection = { cardCollection: { [souvenirFixture.id]: DECK_SIZE }, unlockedCards: [souvenirFixture.id] };
    const souvenirDeck = Array.from({ length: DECK_SIZE }, () => souvenirFixture.id);
    assert(!validateDeck(souvenirDeck, souvenirCollection).ok, "Souvenir cards should not allow more than two copies.");
    assert(buildAutoDeck(souvenirCollection).filter((cardId) => cardId === souvenirFixture.id).length === 2, "Auto deck should use at most two Souvenir copies.");
  } finally {
    CARDS.pop();
  }

  const weightedPool = [
    { id: "test:common", rarity: "common" },
    { id: "test:rare", rarity: "rare" },
    { id: "test:legendary", rarity: "legendary" },
    { id: "test:mythic", rarity: "mythic" },
    { id: "test:souvenir", rarity: "souvenir" },
  ];
  const souvenirDraws = 30_000;
  let souvenirCount = 0;
  for (let index = 0; index < souvenirDraws; index += 1) {
    const [card] = buildPackOpening(weightedPool, 1);
    if (card.rarity === "souvenir") souvenirCount += 1;
  }
  const souvenirRate = souvenirCount / souvenirDraws;
  assert(souvenirRate > 0.0035 && souvenirRate < 0.009, "Souvenir pack rate should stay near 0.6%.");
  console.log("--- CARD REWARDS TEST OK ---");
}

main();
