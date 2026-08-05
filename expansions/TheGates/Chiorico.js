module.exports = {
  name: "Chiorico",
  cost: 5,
  type: "minion",
  attack: 4,
  health: 7,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Malta",
  lore: "On play and at the start of your turns, Mark all enemy minions. Marked enemies take 3 extra damage from the next hit, then Marked is removed.",
  image: "art/chiorico.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatusToAllEnemyMinions", status: "marked", value: 3, turns: 2 },
    { trigger: "onTurnStart", effect: "applyStatusToAllEnemyMinions", status: "marked", value: 3, turns: 2 },
  ],
};
