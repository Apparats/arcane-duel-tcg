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
  lore: "On play, mark an enemy minion for 3 turns. The next strike against it hits harder.",
  image: "art/chiorico.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "marked", value: 3, turns: 2 },
  ],
};
