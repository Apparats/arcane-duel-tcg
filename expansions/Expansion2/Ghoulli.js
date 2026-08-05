module.exports = {
  name: "ghoulli",
  cost: 4,
  type: "minion",
  attack: 4,
  health: 5,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "Luxembourg",
  lore: "On play, gains Taunt, Divine Shield, or Charge at random.",
  image: "art/Ghoulli.webp",
  abilities: [
    { trigger: "onPlay", effect: "grantRandomSelfKeyword", keywords: ["taunt", "divineShield", "charge"] },
  ],
};
