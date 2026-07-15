module.exports = {
  name: "Fanex",
  cost: 4,
  type: "minion",
  attack: 6,
  health: 4,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Rwanda",
  lore: "On play, steal a random non-Mythic card from the enemy deck and add it to your hand. Cannot be played with a full hand.",
  image: "art/Fanex.webp",
  abilities: [
    { trigger: "onPlay", effect: "stealRandomEnemyDeckCardToHand" },
  ],
};
