module.exports = {
  name: "Bloodgiver",
  cost: 5,
  type: "minion",
  attack: 3,
  health: 6,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Poland",
  lore: "The mighty powerful. This card heals itself by 2 every time it attacks.",
  image: "art/Bloodgiver.webp",
  abilities: [
    { trigger: "onAttackMinion", effect: "healSelf", value: 2 },
  ],
};
