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
  lore: "At the start of your next turn, mark 1 random enemy minion once. The next strike hits harder.",
  image: "art/chiorico.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "marked", value: 3, turns: 2, oncePerMinion: true },
  ],
};
