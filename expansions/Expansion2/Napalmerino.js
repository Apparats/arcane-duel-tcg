module.exports = {
  name: "Napalmerino",
  cost: 3,
  type: "minion",
  attack: 3,
  health: 3,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "Germany",
  lore: "On play, choose a minion and heal it for 2. This healing can exceed maximum Health.",
  image: "art/Napalmerino.webp",
  abilities: [
    { trigger: "onPlay", effect: "healTargetMinion", target: "minion", value: 2 },
  ],
};
