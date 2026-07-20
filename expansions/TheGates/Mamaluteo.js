module.exports = {
  name: "Mamaluteo",
  cost: 7,
  type: "minion",
  attack: 5,
  health: 10,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Bolivia",
  lore: "On play, poison an enemy minion or hero for six turns. Poison deals +2 damage.",
  image: "art/mamaluteo.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemy", status: "poisoned", value: 2, turns: 6 },
  ],
};
