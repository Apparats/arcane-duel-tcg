const { Game } = require("../../public/engine");
const { getCardById } = require("../../public/cards");
const { normalizeShieldChallenge } = require("./shieldChallenge");

function requireText(value, label, maxLength) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`Campaign ${label} is invalid.`);
  }
  return value.trim();
}

function boundedInteger(value, label, { min, max, fallback }) {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved < min || resolved > max) {
    throw new Error(`Campaign ${label} is invalid.`);
  }
  return resolved;
}

function normalizeDeck(cardIds) {
  if (!Array.isArray(cardIds) || cardIds.length === 0 || cardIds.length > 120) {
    throw new Error("Campaign NPC deck is invalid.");
  }
  const deck = cardIds.map((cardId) => requireText(cardId, "card id", 120));
  if (deck.some((cardId) => !getCardById(cardId))) {
    throw new Error("Campaign NPC deck contains an unknown card.");
  }
  return deck;
}

function normalizeBoardRules(rules = {}) {
  const maxMinions = rules.maxMinions === null
    ? null
    : boundedInteger(rules.maxMinions, "board limit", { min: 1, max: 30, fallback: 4 });
  return {
    maxMinions,
    allowExtraSummonSlot: rules.allowExtraSummonSlot !== false,
    ignoreKeywordLimits: rules.ignoreKeywordLimits === true,
  };
}

function normalizeCampaignEncounter(definition) {
  if (!definition || typeof definition !== "object") throw new Error("Campaign encounter is invalid.");
  const npc = definition.npc || {};
  const mana = npc.mana || {};
  const manaCap = boundedInteger(mana.cap, "NPC mana cap", { min: 1, max: 30, fallback: 10 });
  const rewardCards = Array.isArray(definition.rewards?.cards) ? definition.rewards.cards : [];
  if (rewardCards.length > 120 || rewardCards.some((cardId) => !getCardById(cardId))) {
    throw new Error("Campaign rewards are invalid.");
  }
  const rewardCount = rewardCards.length > 0
    ? boundedInteger(definition.rewards?.count, "reward count", {
      min: 1,
      max: rewardCards.length,
      fallback: 1,
    })
    : 0;
  const rewardGold = boundedInteger(definition.rewards?.gold, "gold reward", { min: 0, max: 100000, fallback: 0 });
  const rewardGoldOnce = definition.rewards?.goldOnce === true;
  const duplicatePolicy = definition.rewards?.duplicatePolicy === "uniqueUntilComplete" ? "uniqueUntilComplete" : "default";
  if (rewardCards.length === 0 && rewardGold === 0) throw new Error("Campaign rewards are invalid.");
  const openingCardId = npc.openingCardId === undefined
    ? null
    : requireText(npc.openingCardId, "NPC opening card id", 120);
  if (openingCardId && !getCardById(openingCardId)) throw new Error("Campaign NPC opening card is unknown.");
  if (openingCardId && !npc.deck.includes(openingCardId)) throw new Error("Campaign NPC opening card is not in its deck.");
  const shieldChallenge = definition.shieldChallenge ? normalizeShieldChallenge(definition.shieldChallenge) : null;
  if (shieldChallenge && !npc.deck.includes(shieldChallenge.cardId)) {
    throw new Error("Campaign shield challenge card is not in the NPC deck.");
  }

  return Object.freeze({
    id: requireText(definition.id, "id", 64),
    name: requireText(definition.name, "name", 80),
    lore: requireText(definition.lore, "lore", 240),
    available: definition.available !== false,
    theme: requireText(definition.theme || "frost", "theme", 32),
    audio: Object.freeze({
      // This is sent to the client only while this encounter is active.
      // Future stages can select a dedicated board playlist here.
      boardMusic: requireText(definition.audio?.boardMusic || "board", "board music", 64),
    }),
    shieldChallenge,
    rewards: Object.freeze({
      cards: Object.freeze(rewardCards.slice()),
      count: rewardCount,
      gold: rewardGold,
      goldOnce: rewardGoldOnce,
      duplicatePolicy,
    }),
    npc: Object.freeze({
      name: requireText(npc.name, "NPC name", 48),
      avatarUrl: requireText(npc.avatarUrl, "NPC avatar", 240),
      health: boundedInteger(npc.health, "NPC health", { min: 1, max: 999, fallback: 30 }),
      manaCap,
      startingMana: boundedInteger(mana.starting, "NPC starting mana", { min: 1, max: manaCap, fallback: 1 }),
      deck: Object.freeze(normalizeDeck(npc.deck)),
      openingCardId,
      ignoreDeckSizeLimit: npc.ignoreDeckSizeLimit === true,
      uniqueMythicPlays: npc.uniqueMythicPlays === true,
      boardRules: Object.freeze(normalizeBoardRules(npc.boardRules)),
    }),
  });
}

function createCampaignMatch(encounter, { roomCode, playerName, playerDeck, randomInt }) {
  const npc = encounter.npc;
  const game = new Game(roomCode, playerName, npc.name, {
    decks: [playerDeck, npc.deck],
    randomInt,
    playerConfigs: [
      {},
      {
        health: npc.health,
        maxHealth: npc.health,
        manaCap: npc.manaCap,
        startingMana: npc.startingMana,
        ignoreDeckSizeLimit: npc.ignoreDeckSizeLimit,
        uniqueMythicPlays: npc.uniqueMythicPlays,
        boardRules: npc.boardRules,
      },
    ],
  });

  if (npc.openingCardId && !game.players[1].hand.some((ref) => ref === npc.openingCardId)) {
    const deckIndex = game.players[1].deck.indexOf(npc.openingCardId);
    if (deckIndex >= 0) {
      const [openingCard] = game.players[1].deck.splice(deckIndex, 1);
      const replacedCard = game.players[1].hand.pop();
      if (replacedCard) game.players[1].deck.push(replacedCard);
      game.players[1].hand.push(openingCard);
    }
  }

  return {
    game,
    npc: { name: npc.name, avatarUrl: npc.avatarUrl },
  };
}

module.exports = { createCampaignMatch, normalizeCampaignEncounter };
