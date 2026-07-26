module.exports = {
  name: "Gabibbo Ardito",
  cost: 5,
  type: "minion",
  attack: 2,
  health: 7,
  keywords: ["charge"],
  race: "Monster",
  rarity: "legendary",
  country: "Italy",
  lore: "Corruption is only bad if I am not involved. At the start of your turn, clone this card.",
  image: "art/Gabibbo_Ardito.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "summonMinion", cardId: "base:gabibbo-ardito", count: 1 },
  ],
};
