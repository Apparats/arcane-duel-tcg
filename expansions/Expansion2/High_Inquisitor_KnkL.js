module.exports = {
  name: "High_Inquisitor_KnkL",
  cost: 3,
  type: "minion",
  attack: 0,
  health: 1,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Vatican",
  lore: "At the start of each of your turns, this card gains +3/+3.",
  image: "art/High_Inquisitor_KnkL.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "buffSelf", attack: 3, health: 3 },
  ],
};
