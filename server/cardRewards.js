const PACK_RARITY_WEIGHTS = {
  common: 65,
  rare: 25,
  legendary: 8,
  mythic: 2,
};

const STARTER_CARD_COUNT = 20;
const STARTER_GUARANTEED_RARITY = "mythic";
const STARTER_RARITY_LIMITS = { legendary: 3, mythic: 1 };
const STARTER_MAX_COPIES_PER_CARD = 2;
const STARTER_CARD_COPY_LIMITS = { legendary: 1, mythic: 1 };

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

function availableStarterCards(cards, counts) {
  return cards.filter((card) => {
    const copyLimit = STARTER_CARD_COPY_LIMITS[card.rarity || "common"] || STARTER_MAX_COPIES_PER_CARD;
    return (counts[card.id] || 0) < copyLimit;
  });
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

function drawStarterCards(cards) {
  const counts = {};
  const rarityCounts = { [STARTER_GUARANTEED_RARITY]: 0 };
  const mythicCandidates = availableStarterCards(cardsByRarity(cards, STARTER_GUARANTEED_RARITY), counts);
  if (mythicCandidates.length === 0) {
    throw new Error("Starter card pool needs at least one mythic card.");
  }

  const opening = [addDrawnCard(randomFrom(mythicCandidates), counts)];
  rarityCounts[STARTER_GUARANTEED_RARITY] = 1;
  const nonMythicRarities = Object.entries(PACK_RARITY_WEIGHTS)
    .filter(([rarity]) => rarity !== STARTER_GUARANTEED_RARITY)
    .map(([value, weight]) => ({ value, weight }));

  while (opening.length < STARTER_CARD_COUNT) {
    const eligibleRarities = nonMythicRarities.filter(({ value }) => {
      const rarityLimit = STARTER_RARITY_LIMITS[value] ?? Infinity;
      if ((rarityCounts[value] || 0) >= rarityLimit) return false;
      return availableStarterCards(cardsByRarity(cards, value), counts).length > 0;
    });
    if (eligibleRarities.length === 0) {
      throw new Error("Starter card pool does not have enough cards for a legal starter deck.");
    }

    const rarity = weightedPick(eligibleRarities);
    const candidates = availableStarterCards(cardsByRarity(cards, rarity), counts);
    opening.push(addDrawnCard(randomFrom(candidates), counts));
    rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
  }

  return opening;
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
  const opening = drawStarterCards(cards);
  const rarityCounts = opening.reduce((counts, card) => {
    const rarity = card.rarity || "common";
    counts[rarity] = (counts[rarity] || 0) + 1;
    return counts;
  }, {});
  const maxCopies = Math.max(...Object.values(countDrawnCards(opening)));
  if (
    opening.length !== STARTER_CARD_COUNT ||
    maxCopies > STARTER_MAX_COPIES_PER_CARD ||
    rarityCounts.mythic !== 1 ||
    (rarityCounts.legendary || 0) > STARTER_RARITY_LIMITS.legendary
  ) {
    throw new Error("Starter card generation failed copy-limit validation.");
  }
  return opening;
}

module.exports = {
  buildPackOpening,
  buildStarterOpening,
  summarizeOpening,
  PACK_RARITY_WEIGHTS,
  STARTER_CARD_COUNT,
  STARTER_GUARANTEED_RARITY,
  STARTER_MAX_COPIES_PER_CARD,
};
