module.exports = {
  name: "Warerita",
  cost: 3,
  type: "minion",
  attack: 3,
  health: 4,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "Arcana",
  lore: "The first time Warerita is played, gain 1 temporary Mana crystal.",
  image: "art/Warerita.webp",
  abilities: [
    { trigger: "onPlay", effect: "gainTemporaryMana", value: 1, firstPlayOnly: true },
  ],
};
