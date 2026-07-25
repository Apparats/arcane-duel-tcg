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
  lore: "On play, mark an enemy minion. At the start of your turns, mark 1 random enemy minion.",
  image: "art/chiorico.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "marked", value: 3, turns: 2 },
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "marked", value: 3, turns: 2 },
  ],
};
