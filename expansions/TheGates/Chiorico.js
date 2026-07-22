module.exports = {
  name: "Chiorico",
  cost: 5,
  type: "minion",
  attack: 4,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "mythic",
  country: "Malta",
  lore: "On play and at the start of each of your turns, mark an enemy minion. The next strike hits harder.",
  image: "art/chiorico.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "marked", value: 3, turns: 2 },
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "marked", value: 3, turns: 2 },
  ],
};
