module.exports = {
  name: "Gabibbo Ardito",
  cost: 6,
  type: "minion",
  attack: 1,
  health: 6,
  keywords: ["charge"],
  race: "Monster",
  rarity: "mythic",
  country: "Italy",
  lore: "Corruption is only bad if I am not involved. This card clones itself every turn when played.",
  image: "art/Gabibbo_Ardito.webp",
  abilities: [
    { trigger: "onAnyTurnStart", effect: "summonMinion", cardId: "base:gabibbo_ardito", count: 1 },
  ],
};
