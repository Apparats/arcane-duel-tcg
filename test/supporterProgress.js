const { getProgress } = require("../public/profileCatalog");
const { CARDS } = require("../public/cards");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function find(items, id) {
  return items.find((item) => item.id === id);
}

function collectibleExpansionIds(expansionId) {
  return CARDS
    .filter((card) => card.showInInventory !== false && (card._expansionId || String(card.id).split(":")[0]) === expansionId)
    .map((card) => card.id);
}

function main() {
  const locked = getProgress({}, "more-than-honorable", ["more-than-honorable"]);
  assert(!find(locked.titles, "more-than-honorable").unlocked, "Supporter title must remain locked by default.");
  assert(!find(locked.achievements, "more-than-honorable").unlocked, "Supporter achievement must remain locked by default.");
  assert(locked.selectedTitle.id === "initiate", "Locked supporter title must not be selected.");
  assert(locked.equippedBadges.length === 0, "Locked supporter badge must not be equipped.");

  const unlocked = getProgress({}, "more-than-honorable", ["more-than-honorable"], { supporter: true });
  assert(find(unlocked.titles, "more-than-honorable").unlocked, "Supporter title should unlock for supporters.");
  assert(find(unlocked.achievements, "more-than-honorable").unlocked, "Supporter achievement should unlock for supporters.");
  assert(unlocked.selectedTitle.id === "more-than-honorable", "Supporter title should be selectable.");
  assert(unlocked.equippedBadges[0]?.id === "more-than-honorable", "Supporter badge should be equipable.");

  const shopLocked = getProgress({}, "lord-of-the-cards", ["gold-hoarder"]);
  assert(!find(shopLocked.titles, "lord-of-the-cards").unlocked, "Shop title must remain locked before purchase.");
  assert(!find(shopLocked.achievements, "gold-hoarder").unlocked, "Shop achievement must remain locked before purchase.");
  assert(shopLocked.selectedTitle.id === "initiate", "Locked shop title must not be selected.");
  assert(shopLocked.equippedBadges.length === 0, "Locked shop achievement badge must not be equipable.");

  const shopUnlocked = getProgress({}, "lord-of-the-cards", ["gold-hoarder"], {
    purchasedAchievementIds: ["gold-hoarder"],
    purchasedTitleIds: ["lord-of-the-cards"],
  });
  assert(find(shopUnlocked.titles, "lord-of-the-cards").unlocked, "Purchased shop title should unlock.");
  assert(find(shopUnlocked.achievements, "gold-hoarder").unlocked, "Purchased shop achievement should unlock.");
  assert(shopUnlocked.selectedTitle.id === "lord-of-the-cards", "Purchased shop title should be selectable.");
  assert(shopUnlocked.equippedBadges[0]?.id === "gold-hoarder", "Purchased shop badge should be equipable.");

  const tournamentChampion = getProgress({ tournamentWins: 1 }, "tournament-sovereign", ["crown-of-arcana"]);
  assert(find(tournamentChampion.titles, "tournament-sovereign").unlocked, "Tournament champion title should unlock for first place.");
  assert(find(tournamentChampion.achievements, "crown-of-arcana").unlocked, "Tournament champion achievement should unlock for first place.");
  assert(tournamentChampion.selectedTitle.id === "tournament-sovereign", "Tournament champion title should be selectable.");
  assert(tournamentChampion.equippedBadges[0]?.id === "crown-of-arcana", "Tournament champion badge should be equipable.");

  const mythicIds = CARDS.filter((card) => card.rarity === "mythic").slice(0, 10).map((card) => card.id);
  assert(mythicIds.length === 10, "The test requires at least 10 Mythic cards.");
  const nineMythics = getProgress({}, null, [], { unlockedCards: mythicIds.slice(0, 9) });
  assert(!find(nineMythics.achievements, "mythic-constellation").unlocked, "Nine different Mythic cards must not unlock the achievement.");
  const duplicateMythic = getProgress({}, null, [], { cardCollection: { [mythicIds[0]]: 10 } });
  assert(find(duplicateMythic.achievements, "mythic-constellation").current === 1, "Duplicate Mythic copies must count as one card.");
  const mythicCollector = getProgress({}, null, ["mythic-constellation"], { unlockedCards: mythicIds });
  assert(find(mythicCollector.achievements, "mythic-constellation").unlocked, "Ten different Mythic cards should unlock the achievement.");
  assert(mythicCollector.equippedBadges[0]?.id === "mythic-constellation", "Mythic collector badge should be equipable.");

  const unranked = getProgress({}, "quickplay-apex", ["ranking-elite", "ranking-apex"], { quickplayRank: 0 });
  assert(!find(unranked.achievements, "ranking-elite").unlocked, "Unranked players must not unlock the top 5 achievement.");
  assert(!find(unranked.achievements, "ranking-apex").unlocked, "Unranked players must not unlock the top 1 achievement.");
  assert(unranked.selectedTitle.id === "initiate", "The top 1 title must remain locked for unranked players.");
  assert(unranked.equippedBadges.length === 0, "Locked ranking badges must not be equipable.");

  const fifthPlace = getProgress({}, "quickplay-apex", ["ranking-elite", "ranking-apex"], { quickplayRank: 5 });
  assert(find(fifthPlace.achievements, "ranking-elite").unlocked, "Rank 5 should unlock the top 5 achievement.");
  assert(!find(fifthPlace.achievements, "ranking-apex").unlocked, "Rank 5 must not unlock the top 1 achievement.");
  assert(fifthPlace.selectedTitle.id === "initiate", "The top 1 title must stay locked outside rank 1.");
  assert(fifthPlace.equippedBadges.map((badge) => badge.id).join(",") === "ranking-elite", "Only unlocked ranking badges should be equipable.");

  const firstPlace = getProgress({}, "quickplay-apex", ["ranking-elite", "ranking-apex"], { quickplayRank: 1 });
  assert(find(firstPlace.achievements, "ranking-elite").unlocked, "Rank 1 should unlock the top 5 achievement too.");
  assert(find(firstPlace.achievements, "ranking-apex").unlocked, "Rank 1 should unlock the top 1 achievement.");
  assert(firstPlace.selectedTitle.id === "quickplay-apex", "Rank 1 should unlock the only new ranking title.");
  assert(firstPlace.equippedBadges.length === 2, "Rank 1 should be able to equip both ranking badges.");

  const formerFirstPlace = getProgress({}, "quickplay-apex", ["ranking-apex"], { quickplayRank: 12, bestQuickplayRank: 1 });
  assert(find(formerFirstPlace.achievements, "ranking-apex").unlocked, "A previous rank 1 should keep the top 1 achievement unlocked.");
  assert(formerFirstPlace.selectedTitle.id === "quickplay-apex", "A previous rank 1 should keep the top 1 title unlocked.");

  const baseIds = collectibleExpansionIds("base");
  const expansionOneIds = collectibleExpansionIds("expansion1");
  assert(baseIds.length > 0, "The base expansion should have collectible cards.");
  assert(expansionOneIds.length > 0, "Expansion 1 should have collectible cards.");

  const almostBase = getProgress({}, null, [], { unlockedCards: baseIds.slice(1) });
  assert(!find(almostBase.achievements, "base-archivist").unlocked, "Missing one base card must keep the base completion achievement locked.");
  assert(find(almostBase.achievements, "base-archivist").current === baseIds.length - 1, "Base completion should count unique owned base cards.");

  const baseComplete = getProgress({}, null, ["base-archivist"], { unlockedCards: baseIds });
  assert(find(baseComplete.achievements, "base-archivist").unlocked, "Owning every base card should unlock the base completion achievement.");
  assert(baseComplete.equippedBadges[0]?.id === "base-archivist", "The base completion badge should be equipable.");

  const expansionOneCollection = Object.fromEntries(expansionOneIds.map((id) => [id, 2]));
  const expansionOneComplete = getProgress({}, null, ["expansion-one-archivist"], { cardCollection: expansionOneCollection });
  assert(find(expansionOneComplete.achievements, "expansion-one-archivist").unlocked, "Owning every Expansion 1 card should unlock its completion achievement.");
  assert(expansionOneComplete.equippedBadges[0]?.id === "expansion-one-archivist", "The Expansion 1 completion badge should be equipable.");
  console.log("--- SUPPORTER PROGRESSION TEST OK ---");
}

main();
