module.exports = {
  name: "10",
  cost: 3,
  type: "minion",
  attack: 2,
  health: 4,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "Norway",
  lore: "Cannot be attacked. Takes no retaliation damage when attacking, but loses 1 Health at the start of each of your turns.",
  image: "art/10.webp",
  abilities: [
    { trigger: "passive", effect: "unattackable" },
    { trigger: "onTurnStart", effect: "damageSelfOnTurnStart", value: 1 },
  ],
};
