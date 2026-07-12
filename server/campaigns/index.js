const { createCampaignMatch, normalizeCampaignEncounter } = require("./encounterFactory");

const THE_GATES_MYTHICS = [
  "TheGates:archmoth-morlet", "TheGates:cardinal-severin", "TheGates:chiorico", "TheGates:jacquedebalsac", "TheGates:kep",
  "TheGates:mamaluteo", "TheGates:overseer", "TheGates:toy", "TheGates:unwnmas", "TheGates:zoblezar",
];
const PROTECTOR_BASE_COMMONS = [
  "base:aleex", "base:archbishopmaximilian", "base:barto", "base:beitsas", "base:capybara",
  "base:disappointmentpanda", "base:eraserhead", "base:galileo-gunplay", "base:miyabi", "base:stormhazard",
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
    rewardCardIds: encounter.rewards.cards,
    rewardCount: encounter.rewards.count,
  }));
}

module.exports = { createCampaignMatch, getCampaignEncounter, listCampaignEncounters, normalizeCampaignEncounter };
