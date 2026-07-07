const PACK_RARITY_WEIGHTS = {
  common: 68,
  rare: 24,
  legendary: 7,
  mythic: 1,
};

const STARTER_RECIPE = [
  { rarity: "common", count: 12 },
  { rarity: "rare", count: 2 },
  { rarity: "legendary", count: 1 },
];
const STARTER_EXTRA_COUNT = 5;
const STARTER_EXTRA_RARITY_WEIGHTS = {
  common: 76,
  rare: 24,
};
const STARTER_MAX_COPIES_PER_CARD = 2;
const STARTER_CARD_COUNT = STARTER_RECIPE.reduce((sum, entry) => sum + entry.count, STARTER_EXTRA_COUNT);

function assertDrawCount(count, label = "card count") {
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new Error(`Invalid ${label}.`);
  }
  return count;
}

function randomFrom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function weightedPick(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return entries[entries.length - 1].value;
}

function cardsByRarity(cards, rarity) {
  return cards.filter((card) => (card.rarity || "common") === rarity);
}

function availableUnderCopyLimit(cards, counts, maxCopies) {
  return cards.filter((card) => (counts[card.id] || 0) < maxCopies);
}

function addDrawnCard(card, counts) {
  counts[card.id] = (counts[card.id] || 0) + 1;
  return card;
}

function countDrawnCards(cards) {
  return cards.reduce((counts, card) => {
    counts[card.id] = (counts[card.id] || 0) + 1;
    return counts;
  }, {});
}

function uniqueCardsById(cards) {
  return [...new Map(cards.map((card) => [card.id, card])).values()];
}

function enforceMaxCopies(openedCards, cardPool, maxCopies = STARTER_MAX_COPIES_PER_CARD) {
  const uniquePool = uniqueCardsById(cardPool);
  const counts = {};

  return openedCards.map((card) => {
    if ((counts[card.id] || 0) < maxCopies) {
      counts[card.id] = (counts[card.id] || 0) + 1;
      return card;
    }

    const replacementPool = uniquePool.filter((candidate) => (counts[candidate.id] || 0) < maxCopies);
    if (replacementPool.length === 0) {
      throw new Error("Starter card pool does not have enough unique cards for the copy limit.");
    }

    const replacement = randomFrom(replacementPool);
    counts[replacement.id] = (counts[replacement.id] || 0) + 1;
    return replacement;
  });
}

function drawWeightedCards(cards, count) {
  assertDrawCount(count, "pack size");
  const rarities = Object.entries(PACK_RARITY_WEIGHTS).map(([value, weight]) => ({ value, weight }));
  return drawWeightedCardsFromRarities(cards, count, rarities);
}

function drawWeightedCardsFromRarities(cards, count, rarities) {
  assertDrawCount(count, "draw count");
  return Array.from({ length: count }, () => {
    for (let attempts = 0; attempts < 8; attempts++) {
      const pool = cardsByRarity(cards, weightedPick(rarities));
      if (pool.length > 0) return randomFrom(pool);
    }
    return randomFrom(cards);
  });
}

function drawRecipeCards(cards, recipe = STARTER_RECIPE) {
  return recipe.flatMap(({ rarity, count }) => {
    const pool = cardsByRarity(cards, rarity);
    const fallback = pool.length > 0 ? pool : cards;
    return Array.from({ length: count }, () => randomFrom(fallback));
  });
}

function drawRecipeCardsWithLimit(cards, counts, recipe = STARTER_RECIPE, maxCopies = STARTER_MAX_COPIES_PER_CARD) {
  return recipe.flatMap(({ rarity, count }) => {
    const rarityPool = cardsByRarity(cards, rarity);
    const pool = rarityPool.length > 0 ? rarityPool : cards;

    return Array.from({ length: count }, () => {
      const candidates = availableUnderCopyLimit(pool, counts, maxCopies);
      const fallbackCandidates = availableUnderCopyLimit(cards, counts, maxCopies);
      const card = randomFrom(candidates.length > 0 ? candidates : fallbackCandidates);
      return addDrawnCard(card, counts);
    });
  });
}

function drawWeightedCardsFromRaritiesWithLimit(cards, count, rarities, counts, maxCopies = STARTER_MAX_COPIES_PER_CARD) {
  assertDrawCount(count, "draw count");
  return Array.from({ length: count }, () => {
    for (let attempts = 0; attempts < 8; attempts++) {
      const rarityPool = cardsByRarity(cards, weightedPick(rarities));
      const candidates = availableUnderCopyLimit(rarityPool, counts, maxCopies);
      if (candidates.length > 0) return addDrawnCard(randomFrom(candidates), counts);
    }

    const allowedRarities = new Set(rarities.map((entry) => entry.value));
    const fallbackCandidates = availableUnderCopyLimit(
      cards.filter((card) => allowedRarities.has(card.rarity || "common")),
      counts,
      maxCopies
    );
    const card = randomFrom(fallbackCandidates.length > 0 ? fallbackCandidates : availableUnderCopyLimit(cards, counts, maxCopies));
    return addDrawnCard(card, counts);
  });
}

function summarizeOpening(openedCards, existingCollection = {}) {
  const counts = { ...existingCollection };
  const cards = openedCards.map((card) => {
    const previousCount = counts[card.id] || 0;
    counts[card.id] = previousCount + 1;
    return {
      ...card,
      isNew: previousCount === 0,
      quantityAfter: counts[card.id],
    };
  });

  const collectionIncrements = {};
  cards.forEach((card) => {
    collectionIncrements[card.id] = (collectionIncrements[card.id] || 0) + 1;
  });

  return {
    cards,
    collectionIncrements,
    newCardIds: cards.filter((card) => card.isNew).map((card) => card.id),
  };
}

function buildPackOpening(cards, packSize) {
  return drawWeightedCards(cards, packSize);
}

function buildStarterOpening(cards) {
  const counts = {};
  const guaranteedCards = drawRecipeCardsWithLimit(cards, counts, STARTER_RECIPE);
  const extraRarities = Object.entries(STARTER_EXTRA_RARITY_WEIGHTS).map(([value, weight]) => ({ value, weight }));
  const extraCards = drawWeightedCardsFromRaritiesWithLimit(cards, STARTER_EXTRA_COUNT, extraRarities, counts);
  const opening = enforceMaxCopies([...guaranteedCards, ...extraCards], cards);
  const maxCopies = Math.max(...Object.values(countDrawnCards(opening)));
  if (opening.length !== STARTER_CARD_COUNT || maxCopies > STARTER_MAX_COPIES_PER_CARD) {
    throw new Error("Starter card generation failed copy-limit validation.");
  }
  return opening;
}

module.exports = {
  buildPackOpening,
  buildStarterOpening,
  summarizeOpening,
  STARTER_RECIPE,
  STARTER_EXTRA_COUNT,
  STARTER_EXTRA_RARITY_WEIGHTS,
  STARTER_MAX_COPIES_PER_CARD,
};
