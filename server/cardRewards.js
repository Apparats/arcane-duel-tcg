const PACK_RARITY_WEIGHTS = {
  common: 64.4,
  rare: 25,
  legendary: 8,
  mythic: 2,
  souvenir: 0.6,
};

const STARTER_CARD_COUNT = 20;
const STARTER_GUARANTEED_RARITY = "mythic";
const STARTER_RARITY_LIMITS = { legendary: 3, mythic: 1 };
const STARTER_MAX_COPIES_PER_CARD = 2;
const STARTER_CARD_COPY_LIMITS = { legendary: 1, mythic: 1 };
const { secureRandomFrom, secureRandomInt } = require("./random");
const { MAX_SPELLS } = require("../public/deckRules");

function assertDrawCount(count, label = "card count") {
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new Error(`Invalid ${label}.`);
  }
  return count;
}

function randomFrom(pool) {
  return secureRandomFrom(pool);
}

function weightedPick(entries) {
  const scale = 10;
  const weighted = entries
    .map((entry) => ({ ...entry, weight: Math.max(0, Math.round(Number(entry.weight || 0) * scale)) }))
    .filter((entry) => entry.weight > 0);
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return null;
  let roll = secureRandomInt(total);
  for (const entry of weighted) {
    if (roll < entry.weight) return entry.value;
    roll -= entry.weight;
  }
  return weighted[weighted.length - 1].value;
}

function cardsByRarity(cards, rarity) {
  return cards.filter((card) => (card.rarity || "common") === rarity);
}

function availableStarterCards(cards, counts, spellCount = 0) {
  return cards.filter((card) => {
    const copyLimit = STARTER_CARD_COPY_LIMITS[card.rarity || "common"] || STARTER_MAX_COPIES_PER_CARD;
    return (counts[card.id] || 0) < copyLimit && (card.type !== "spell" || spellCount < MAX_SPELLS);
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
  let spellCount = opening[0].type === "spell" ? 1 : 0;
  const nonMythicRarities = Object.entries(PACK_RARITY_WEIGHTS)
    .filter(([rarity]) => rarity !== STARTER_GUARANTEED_RARITY)
    .map(([value, weight]) => ({ value, weight }));

  while (opening.length < STARTER_CARD_COUNT) {
    const eligibleRarities = nonMythicRarities.filter(({ value }) => {
      const rarityLimit = STARTER_RARITY_LIMITS[value] ?? Infinity;
      if ((rarityCounts[value] || 0) >= rarityLimit) return false;
      return availableStarterCards(cardsByRarity(cards, value), counts, spellCount).length > 0;
    });
    if (eligibleRarities.length === 0) {
      throw new Error("Starter card pool does not have enough cards for a legal starter deck.");
    }

    const rarity = weightedPick(eligibleRarities);
    const candidates = availableStarterCards(cardsByRarity(cards, rarity), counts, spellCount);
    const card = addDrawnCard(randomFrom(candidates), counts);
    opening.push(card);
    rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
    if (card.type === "spell") spellCount += 1;
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
    opening.filter((card) => card.type === "spell").length > MAX_SPELLS ||
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
