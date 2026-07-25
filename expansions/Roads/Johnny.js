module.exports = {
  name: "Johnny",
  cost: 1,
  type: "minion",
  attack: 1,
  health: 2,
  keywords: [],
  race: "Human",
  rarity: "souvenir",
  country: "Chile",
  lore: "On play, gain 2 temporary Mana this turn.",
  image: "art/Johnny.webp",
  abilities: [
    { trigger: "onPlay", effect: "gainTemporaryMana", value: 2 },
  ],
};
