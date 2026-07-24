const assert = require("assert");
const { campaignProgressionAccess, getCampaignEncounter, listCampaignEncounters } = require("../server/campaigns");

const freshCampaigns = listCampaignEncounters({});
const gates = freshCampaigns.find((campaign) => campaign.id === "the-gates");
const ironWatch = freshCampaigns.find((campaign) => campaign.id === "iron-watch");

assert(gates, "The Gates campaign should exist.");
assert(ironWatch, "Iron Watch campaign should exist.");
assert.strictEqual(gates.unlocked, true, "The first campaign stage should be unlocked.");
assert.strictEqual(gates.locked, false, "The first campaign stage should not be locked.");
assert.strictEqual(ironWatch.unlocked, false, "Higher campaign stages should be locked without previous completion.");
assert.strictEqual(ironWatch.locked, true, "Iron Watch should be marked locked without a The Gates win.");
assert(ironWatch.lockReason.includes("The Gates"), "Locked higher stages should tell the player which previous stage is required.");

const protectorEncounter = getCampaignEncounter("the-gates");
assert.strictEqual(protectorEncounter.npc.health, 30, "The Protector should have 30 Health.");
assert.strictEqual(protectorEncounter.npc.uniqueMythicPlays, true, "The Protector should play each Mythic card only once.");

const blockedAccess = campaignProgressionAccess("iron-watch", {});
assert.strictEqual(blockedAccess.unlocked, false, "Direct campaign access should reject locked higher stages.");
assert.strictEqual(blockedAccess.previousCampaign.id, "the-gates", "Iron Watch should depend on The Gates.");

const completedProgress = { "the-gates": { wins: 1 } };
const unlockedAccess = campaignProgressionAccess("iron-watch", completedProgress);
assert.strictEqual(unlockedAccess.unlocked, true, "A win in the previous campaign should unlock the next stage.");

const unlockedCampaigns = listCampaignEncounters(completedProgress);
const unlockedIronWatch = unlockedCampaigns.find((campaign) => campaign.id === "iron-watch");
assert.strictEqual(unlockedIronWatch.unlocked, true, "The campaign list should expose unlocked stages after progress.");
assert.strictEqual(unlockedIronWatch.locked, false, "Unlocked stages should not remain marked locked.");

console.log("--- CAMPAIGN PROGRESSION TEST OK ---");
