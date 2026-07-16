const { createCampaignMatch, normalizeCampaignEncounter } = require("./encounterFactory");

const THE_GATES_MYTHICS = [
  "TheGates:archmoth-morlet", "TheGates:cardinal-severin", "TheGates:chiorico", "TheGates:jacquedebalsac", "TheGates:kep",
  "TheGates:mamaluteo", "TheGates:overseer", "TheGates:toy", "TheGates:unwnmas", "TheGates:zoblezar",
];
const PROTECTOR_BASE_COMMONS = [
  "base:aleex", "base:archbishopmaximilian", "base:barto", "base:beitsas", "base:capybara",
  "base:disappointmentpanda", "base:eraserhead", "base:galileo-gunplay", "base:miyabi", "base:stormhazard",
];
const IRON_WATCH_DECK = [
  "campaign2:iron-sentinel",
  ...PROTECTOR_BASE_COMMONS,
  "base:aleex", "base:barto", "base:capybara", "base:stormhazard",
];

const CAMPAIGN_DEFINITIONS = Object.freeze([{
  id: "the-gates",
  name: "The Gates",
  lore: "Beyond the frozen gates, The Protector tests every challenger worthy of Arcana's oldest relics.",
  theme: "frost",
  audio: { boardMusic: "board" },
  // One random mythic is awarded for each victory. The full list remains
  // the reward pool and can contain repeat drops across future victories.
  rewards: { cards: THE_GATES_MYTHICS, count: 1 },
  npc: {
    name: "The Protector",
    avatarUrl: "art/Protector.webp",
    health: 32,
    mana: { starting: 2, cap: 10 },
    deck: [...THE_GATES_MYTHICS, ...PROTECTOR_BASE_COMMONS],
    boardRules: { maxMinions: 4 },
  },
}, {
  id: "iron-watch",
  name: "Iron Watch",
  available: true,
  lore: "TheUnchained's shield trial begins whenever it takes the field or survives to its next turn.",
  theme: "frost",
  audio: { boardMusic: "board" },
  rewards: { gold: 250, goldOnce: true },
  shieldChallenge: {
    cardId: "campaign2:iron-sentinel",
    arrowCount: 10,
    maxArrowCount: 24,
    intervalMs: 470,
    travelMs: 740,
    damagePerHit: 1,
    arrowIncrease: 1,
    intervalReductionMs: 20,
    minIntervalMs: 260,
    travelReductionMs: 25,
    minTravelMs: 450,
  },
  npc: {
    name: "TheUnchained",
    avatarUrl: "art/TheUnchained.webp",
    health: 30,
    mana: { starting: 1, cap: 10 },
    deck: IRON_WATCH_DECK,
    openingCardId: "campaign2:iron-sentinel",
    boardRules: { maxMinions: 4 },
  },
}]);
const encounters = new Map(CAMPAIGN_DEFINITIONS.map((definition) => {
  const encounter = normalizeCampaignEncounter(definition);
  return [encounter.id, encounter];
}));

function getCampaignEncounter(id) {
  return encounters.get(id) || null;
}

function listCampaignEncounters() {
  return [...encounters.values()].map((encounter) => ({
    id: encounter.id,
    name: encounter.name,
    lore: encounter.lore,
    available: encounter.available,
    npcName: encounter.npc.name,
    rewardCardIds: encounter.rewards.cards,
    rewardCount: encounter.rewards.count,
    rewardGold: encounter.rewards.gold,
    rewardGoldOnce: encounter.rewards.goldOnce,
  }));
}

module.exports = { createCampaignMatch, getCampaignEncounter, listCampaignEncounters, normalizeCampaignEncounter };
