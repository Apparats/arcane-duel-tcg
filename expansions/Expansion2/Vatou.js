module.exports = {
  name: "Vatou",
  cost: 3,
  type: "minion",
  attack: 3,
  health: 5,
  keywords: [],
  race: "Human",
  rarity: "souvenir",
  country: "Arcana",
  lore: "On play, draw 2 random cards from your deck.",
  image: "art/Vatou.webp",
  abilities: [
    { trigger: "onPlay", effect: "drawRandomDeckCards", value: 2 },
  ],
};
