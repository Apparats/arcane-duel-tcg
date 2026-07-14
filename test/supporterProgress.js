const { getProgress } = require("../public/profileCatalog");

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
  console.log("--- SUPPORTER PROGRESSION TEST OK ---");
}

main();
