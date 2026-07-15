const { getProgress } = require("../public/profileCatalog");
const { CARDS } = require("../public/cards");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function find(items, id) {
  return items.find((item) => item.id === id);
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
  console.log("--- SUPPORTER PROGRESSION TEST OK ---");
}

main();
