module.exports = {
  name: "Jakal",
  cost: 7,
  type: "minion",
  attack: 1,
  health: 12,
  keywords: [],
  race: "Monster",
  rarity: "legendary",
  country: "Portugal",
  lore: "The mighty god, when this card it's prepared, it will deal 1 of damage to every card of the board.",
  image: "art/Jakal.webp",
  abilities: [
    { trigger: "onAnyTurnStart", effect: "damageAllMinions", value: 1 },
  ],
};
