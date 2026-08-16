const assert = require("assert");
const { campaignProgressionAccess, campaignProgressionAccessForList, getCampaignEncounter, listCampaignEncounters } = require("../server/campaigns");
const { CARDS, getCardById } = require("../public/cards");

const freshCampaigns = listCampaignEncounters({});
const gates = freshCampaigns.find((campaign) => campaign.id === "the-gates");
const ironWatch = freshCampaigns.find((campaign) => campaign.id === "iron-watch");
const fireElemental = freshCampaigns.find((campaign) => campaign.id === "fire-elemental");
const mimic = freshCampaigns.find((campaign) => campaign.id === "mimic");

assert(gates, "The Gates campaign should exist.");
assert(ironWatch, "Iron Watch campaign should exist.");
assert(fireElemental, "FireElemental campaign should exist.");
assert(mimic, "Mimic campaign should exist.");
assert.strictEqual(gates.unlocked, true, "The first campaign stage should be unlocked.");
assert.strictEqual(gates.locked, false, "The first campaign stage should not be locked.");
assert.strictEqual(ironWatch.unlocked, true, "Iron Watch should be unlocked by default.");
assert.strictEqual(ironWatch.locked, false, "Iron Watch should not require a The Gates win.");
assert.strictEqual(fireElemental.unlocked, true, "Stage 3 should be unlocked by default.");
assert.strictEqual(fireElemental.locked, false, "Stage 3 should not require an Iron Watch win yet.");
assert.strictEqual(mimic.unlocked, false, "Stage 4 (Mimic) should be locked by default.");
assert.strictEqual(mimic.locked, true, "Stage 4 (Mimic) should require completing Stage 3.");
assert(mimic.lockReason.includes("FireElemental"), "Mimic lock reason should cite FireElemental.");

const protectorEncounter = getCampaignEncounter("the-gates");
assert.strictEqual(protectorEncounter.npc.health, 30, "The Protector should have 30 Health.");
assert.strictEqual(protectorEncounter.npc.uniqueMythicPlays, true, "The Protector should play each Mythic card only once.");

const fireEncounter = getCampaignEncounter("fire-elemental");
assert.strictEqual(fireEncounter.theme, "fire", "FireElemental should use the fire board theme.");
assert.strictEqual(fireEncounter.npc.health, 25, "FireElemental should have 25 Health.");
assert.strictEqual(fireEncounter.npc.startingMana, 3, "FireElemental should start with 3 base Mana.");
assert.strictEqual(fireEncounter.npc.deck.length, 20, "FireElemental should use a 20-card deck.");
assert(fireEncounter.npc.deck.every((cardId) => ["legendary", "mythic"].includes(getCardById(cardId).rarity)), "FireElemental should only play legendary and mythic cards.");

const mimicEncounter = getCampaignEncounter("mimic");
assert.strictEqual(mimicEncounter.npc.health, 40, "Mimic should have 40 Health.");
assert.strictEqual(mimicEncounter.rewards.gold, 300, "Mimic should award 300 gold.");
assert.strictEqual(mimicEncounter.rewards.goldOnce, true, "Mimic gold reward should be one-time.");

const { createCampaignMatch } = require("../server/campaigns");
const mimicMatch = createCampaignMatch(mimicEncounter, {
  roomCode: "MIMIC_TEST",
  playerName: "Jonathan",
  playerDeck: ["base:aleex"],
  playerAvatarUrl: "custom_avatar.webp",
});
assert.strictEqual(mimicMatch.npc.name, "Mimic Jonathan", "Mimic should append 'Mimic ' to player's name.");
assert.strictEqual(mimicMatch.npc.avatarUrl, "custom_avatar.webp", "Mimic should copy the player's avatar.");
assert.strictEqual(mimicMatch.game.players[1].health, 40, "Mimic in game should have 40 Health.");
const allMimicCards = [...mimicMatch.game.players[1].deck, ...mimicMatch.game.players[1].hand];
assert(allMimicCards.includes("base:aleex"), "Mimic should copy the player's deck.");

const mimicAccessLocked = campaignProgressionAccess("mimic", {});
assert.strictEqual(mimicAccessLocked.unlocked, false, "Stage 4 Mimic should be locked without Stage 3 win.");
assert.strictEqual(mimicAccessLocked.previousCampaign.id, "fire-elemental", "Stage 4 Mimic should depend on FireElemental.");

const mimicAccessUnlocked = campaignProgressionAccess("mimic", { "fire-elemental": { wins: 1 } });
assert.strictEqual(mimicAccessUnlocked.unlocked, true, "Stage 4 Mimic should unlock after completing Stage 3 FireElemental.");

console.log("--- CAMPAIGN PROGRESSION TEST OK ---");
