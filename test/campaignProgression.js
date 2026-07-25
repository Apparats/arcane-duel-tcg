const assert = require("assert");
const { campaignProgressionAccess, campaignProgressionAccessForList, getCampaignEncounter, listCampaignEncounters } = require("../server/campaigns");
const { CARDS, getCardById } = require("../public/cards");

const freshCampaigns = listCampaignEncounters({});
const gates = freshCampaigns.find((campaign) => campaign.id === "the-gates");
const ironWatch = freshCampaigns.find((campaign) => campaign.id === "iron-watch");
const fireElemental = freshCampaigns.find((campaign) => campaign.id === "fire-elemental");

assert(gates, "The Gates campaign should exist.");
assert(ironWatch, "Iron Watch campaign should exist.");
assert(fireElemental, "FireElemental campaign should exist.");
assert.strictEqual(gates.unlocked, true, "The first campaign stage should be unlocked.");
assert.strictEqual(gates.locked, false, "The first campaign stage should not be locked.");
assert.strictEqual(ironWatch.unlocked, true, "Iron Watch should be unlocked by default.");
assert.strictEqual(ironWatch.locked, false, "Iron Watch should not require a The Gates win.");
assert.strictEqual(fireElemental.unlocked, true, "Stage 3 should be unlocked by default.");
assert.strictEqual(fireElemental.locked, false, "Stage 3 should not require an Iron Watch win yet.");

const protectorEncounter = getCampaignEncounter("the-gates");
assert.strictEqual(protectorEncounter.npc.health, 30, "The Protector should have 30 Health.");
assert.strictEqual(protectorEncounter.npc.uniqueMythicPlays, true, "The Protector should play each Mythic card only once.");

const fireEncounter = getCampaignEncounter("fire-elemental");
assert.strictEqual(fireEncounter.theme, "fire", "FireElemental should use the fire board theme.");
assert.strictEqual(fireEncounter.npc.health, 25, "FireElemental should have 25 Health.");
assert.strictEqual(fireEncounter.npc.startingMana, 3, "FireElemental should start with 3 base Mana.");
assert.strictEqual(fireEncounter.npc.deck.length, 20, "FireElemental should use a 20-card deck.");
assert(fireEncounter.npc.deck.every((cardId) => ["legendary", "mythic"].includes(getCardById(cardId).rarity)), "FireElemental should only play legendary and mythic cards.");
const latestLegendaryMythicDeck = CARDS
  .filter((card) => ["legendary", "mythic"].includes(card.rarity))
  .filter((card) => !["campaign2", "special"].includes(card._expansionId))
  .slice(-20)
  .map((card) => card.id);
assert.deepStrictEqual(fireEncounter.npc.deck, latestLegendaryMythicDeck, "FireElemental should use the latest 20 legendary/mythic cards.");
assert(fireEncounter.rewards.cards.every((cardId) => cardId.startsWith("roads:")), "FireElemental should reward Roads cards.");
assert.strictEqual(fireEncounter.rewards.gold, 150, "FireElemental should award 150 gold.");
assert.strictEqual(fireEncounter.rewards.goldOnce, true, "FireElemental gold should be one-time only.");
assert.strictEqual(fireEncounter.rewards.duplicatePolicy, "uniqueUntilComplete", "FireElemental should avoid Roads duplicates until complete.");

const ironWatchAccess = campaignProgressionAccess("iron-watch", {});
assert.strictEqual(ironWatchAccess.unlocked, true, "Direct campaign access should allow Iron Watch by default.");
assert.strictEqual(ironWatchAccess.previousCampaign, null, "Iron Watch should not depend on The Gates.");
const fireElementalAccess = campaignProgressionAccess("fire-elemental", {});
assert.strictEqual(fireElementalAccess.unlocked, true, "Direct campaign access should allow FireElemental by default.");
assert.strictEqual(fireElementalAccess.previousCampaign, null, "FireElemental should not depend on Iron Watch yet.");

const futureCampaigns = [
  { id: "the-gates", name: "The Gates" },
  { id: "iron-watch", name: "Iron Watch" },
  { id: "fire-elemental", name: "FireElemental" },
  { id: "future-fourth", name: "Future Fourth" },
];
const blockedFutureAccess = campaignProgressionAccessForList(futureCampaigns, "future-fourth", {});
assert.strictEqual(blockedFutureAccess.unlocked, false, "A future fourth campaign should require Stage 3 completion.");
assert.strictEqual(blockedFutureAccess.previousCampaign.id, "fire-elemental", "A future fourth campaign should depend on FireElemental.");
assert(blockedFutureAccess.reason.includes("FireElemental"), "Future locked campaigns should name the required previous stage.");
assert.strictEqual(
  campaignProgressionAccessForList(futureCampaigns, "future-fourth", { "fire-elemental": { wins: 1 } }).unlocked,
  true,
  "A future fourth campaign should unlock after Stage 3 is complete."
);

const completedProgress = { "the-gates": { wins: 1 } };
const unlockedAccess = campaignProgressionAccess("iron-watch", completedProgress);
assert.strictEqual(unlockedAccess.unlocked, true, "Iron Watch should remain unlocked after The Gates is complete.");
assert.strictEqual(campaignProgressionAccess("fire-elemental", completedProgress).unlocked, true, "Stage 3 should be unlocked even before Iron Watch is complete.");

const unlockedCampaigns = listCampaignEncounters(completedProgress);
const unlockedIronWatch = unlockedCampaigns.find((campaign) => campaign.id === "iron-watch");
assert.strictEqual(unlockedIronWatch.unlocked, true, "The campaign list should expose unlocked stages after progress.");
assert.strictEqual(unlockedIronWatch.locked, false, "Unlocked stages should not remain marked locked.");

const completedIronWatch = { "the-gates": { wins: 1 }, "iron-watch": { wins: 1 } };
const unlockedFireElemental = listCampaignEncounters(completedIronWatch).find((campaign) => campaign.id === "fire-elemental");
assert.strictEqual(unlockedFireElemental.unlocked, true, "Stage 3 should unlock after Iron Watch is complete.");
assert.strictEqual(unlockedFireElemental.locked, false, "Unlocked Stage 3 should not remain marked locked.");

console.log("--- CAMPAIGN PROGRESSION TEST OK ---");
