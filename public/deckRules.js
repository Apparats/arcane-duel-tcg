(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./cards"));
  } else {
    root.TCGDeckRules = factory(root.TCGCards);
  }
})(typeof self !== "undefined" ? self : this, function (CardsModule) {
  const { CARDS, getCardById, buildStarterDeck } = CardsModule;

  const DECK_SIZE = 20;
  const MAX_BOARD = 4;
  const MAX_SPELLS = 3;
  const RARITY_TOTAL_LIMITS = {
    legendary: 3,
    mythic: 1,
  };
  const CARD_COPY_LIMITS = {
    common: 2,
    rare: 2,
    legendary: 1,
    mythic: 1,
  };

  function countCards(cardIds) {
    return cardIds.reduce((counts, cardId) => {
      counts[cardId] = (counts[cardId] || 0) + 1;
      return counts;
    }, {});
  }

  function countSpellCards(cardIds) {
    return cardIds.reduce((total, cardId) => total + (getCardById(cardId)?.type === "spell" ? 1 : 0), 0);
  }

  function getCardRarity(cardId) {
    return getCardById(cardId)?.rarity || "common";
  }

  function getOwnedCount(collection, cardId) {
    const unlocked = collection?.unlockedCards || [];
    const copies = collection?.cardCollection || {};
    if (Object.prototype.hasOwnProperty.call(copies, cardId)) return copies[cardId] || 0;
    return unlocked.includes(cardId) ? 1 : 0;
  }

  function validateDeck(cardIds, collection = {}) {
    const errors = [];
    if (!Array.isArray(cardIds)) return { ok: false, errors: ["Deck must be a card id array."] };
    if (cardIds.length !== DECK_SIZE) errors.push(`Deck must have exactly ${DECK_SIZE} cards.`);

    const counts = countCards(cardIds);
    const rarityTotals = {};

    if (countSpellCards(cardIds) > MAX_SPELLS) {
      errors.push(`Spell cards: max ${MAX_SPELLS} total.`);
    }

    Object.entries(counts).forEach(([cardId, amount]) => {
      const card = getCardById(cardId);
      if (!card) {
        errors.push(`Unknown card: ${cardId}.`);
        return;
      }

      const rarity = getCardRarity(cardId);
      rarityTotals[rarity] = (rarityTotals[rarity] || 0) + amount;

      const copyLimit = CARD_COPY_LIMITS[rarity] || 2;
      if (amount > copyLimit) errors.push(`${card.name}: max ${copyLimit} ${copyLimit === 1 ? "copy" : "copies"}.`);

      const owned = getOwnedCount(collection, cardId);
      if (amount > owned) errors.push(`${card.name}: you own ${owned}, deck uses ${amount}.`);
    });

    Object.entries(RARITY_TOTAL_LIMITS).forEach(([rarity, limit]) => {
      if ((rarityTotals[rarity] || 0) > limit) {
        errors.push(`${rarity} cards: max ${limit} total.`);
      }
    });

    return { ok: errors.length === 0, errors };
  }

  function buildFallbackDeck() {
    const deck = [];
    const counts = {};
    const rarityTotals = {};
    let spellTotal = 0;
    const candidates = buildStarterDeck()
      .map((cardId) => getCardById(cardId))
      .filter(Boolean)
      .sort((a, b) => {
        const order = { common: 0, rare: 1, legendary: 2, mythic: 3 };
        return (order[a.rarity || "common"] ?? 0) - (order[b.rarity || "common"] ?? 0) || a.cost - b.cost;
      });

    function canAdd(card) {
      const rarity = card.rarity || "common";
      const copyLimit = CARD_COPY_LIMITS[rarity] || 2;
      const totalLimit = RARITY_TOTAL_LIMITS[rarity] || Infinity;
      return (
        (counts[card.id] || 0) < copyLimit &&
        (rarityTotals[rarity] || 0) < totalLimit &&
        (card.type !== "spell" || spellTotal < MAX_SPELLS)
      );
    }

    while (deck.length < DECK_SIZE) {
      const next = candidates.find(canAdd);
      if (!next) break;
      const rarity = next.rarity || "common";
      deck.push(next.id);
      counts[next.id] = (counts[next.id] || 0) + 1;
      rarityTotals[rarity] = (rarityTotals[rarity] || 0) + 1;
      if (next.type === "spell") spellTotal += 1;
    }

    return deck;
  }

  function buildAutoDeck(collection = {}) {
    const deck = [];
    const counts = {};
    const rarityTotals = {};
    let spellTotal = 0;
    const rarityOrder = { mythic: 0, legendary: 1, rare: 2, common: 3 };
    const candidates = CARDS
      .map((card) => ({ card, owned: getOwnedCount(collection, card.id) }))
      .filter((entry) => entry.owned > 0)
      .sort((a, b) => {
        const rarityDiff = (rarityOrder[a.card.rarity || "common"] ?? 4) - (rarityOrder[b.card.rarity || "common"] ?? 4);
        return rarityDiff || a.card.cost - b.card.cost || a.card.name.localeCompare(b.card.name);
      });

    function canAdd(entry) {
      const card = entry.card;
      const rarity = card.rarity || "common";
      const copyLimit = CARD_COPY_LIMITS[rarity] || 2;
      const totalLimit = RARITY_TOTAL_LIMITS[rarity] || Infinity;
      return (
        (counts[card.id] || 0) < Math.min(entry.owned, copyLimit) &&
        (rarityTotals[rarity] || 0) < totalLimit &&
        (card.type !== "spell" || spellTotal < MAX_SPELLS) &&
        deck.length < DECK_SIZE
      );
    }

    const maxCopies = Math.max(0, ...candidates.map((entry) => Math.min(entry.owned, CARD_COPY_LIMITS[entry.card.rarity || "common"] || 2)));
    for (let copyNumber = 1; copyNumber <= maxCopies && deck.length < DECK_SIZE; copyNumber += 1) {
      candidates.forEach((entry) => {
        if (deck.length >= DECK_SIZE || !canAdd(entry) || (counts[entry.card.id] || 0) >= copyNumber) return;
        const rarity = entry.card.rarity || "common";
        deck.push(entry.card.id);
        counts[entry.card.id] = (counts[entry.card.id] || 0) + 1;
        rarityTotals[rarity] = (rarityTotals[rarity] || 0) + 1;
        if (entry.card.type === "spell") spellTotal += 1;
      });
    }

    return deck;
  }

  function buildRandomLegalDeck({ randomInt = (maxExclusive) => Math.floor(Math.random() * maxExclusive), includeCard = () => true } = {}) {
    if (typeof randomInt !== "function" || typeof includeCard !== "function") {
      throw new Error("Random deck generation requires valid options.");
    }

    const candidates = CARDS.filter((card) => card.showInInventory !== false && includeCard(card));
    const collection = {
      cardCollection: Object.fromEntries(candidates.map((card) => [
        card.id,
        CARD_COPY_LIMITS[card.rarity || "common"] || 2,
      ])),
    };
    const deck = [];
    const counts = {};
    const rarityTotals = {};
    let spellTotal = 0;

    function canAdd(card) {
      const rarity = card.rarity || "common";
      const copyLimit = CARD_COPY_LIMITS[rarity] || 2;
      const rarityLimit = RARITY_TOTAL_LIMITS[rarity] || Infinity;
      return (
        (counts[card.id] || 0) < copyLimit &&
        (rarityTotals[rarity] || 0) < rarityLimit &&
        (card.type !== "spell" || spellTotal < MAX_SPELLS)
      );
    }

    while (deck.length < DECK_SIZE) {
      const eligible = candidates.filter(canAdd);
      if (eligible.length === 0) throw new Error("Not enough eligible cards to build a legal random deck.");
      const card = eligible[randomInt(eligible.length)];
      if (!card) throw new Error("Random deck generator returned an invalid card index.");
      const rarity = card.rarity || "common";
      deck.push(card.id);
      counts[card.id] = (counts[card.id] || 0) + 1;
      rarityTotals[rarity] = (rarityTotals[rarity] || 0) + 1;
      if (card.type === "spell") spellTotal += 1;
    }

    const validation = validateDeck(deck, collection);
    if (!validation.ok) throw new Error(`Generated deck is invalid: ${validation.errors.join(" ")}`);
    return deck;
  }

  return {
    DECK_SIZE,
    MAX_BOARD,
    MAX_SPELLS,
    RARITY_TOTAL_LIMITS,
    CARD_COPY_LIMITS,
    countCards,
    countSpellCards,
    getOwnedCount,
    validateDeck,
    buildAutoDeck,
    buildRandomLegalDeck,
    buildFallbackDeck,
    CARDS,
  };
});
