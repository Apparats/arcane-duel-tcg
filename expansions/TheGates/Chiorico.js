module.exports = {
  name: "Chiorico",
  cost: 5,
  type: "minion",
  attack: 4,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Malta",
  lore: "Marked enemies take 3 extra damage from the next hit, then Marked is removed. Applies on play and each turn.",
  image: "art/chiorico.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "marked", value: 3, turns: 2 },
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "marked", value: 3, turns: 2 },
  ],
};
