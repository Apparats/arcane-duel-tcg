module.exports = {
  name: "High_Inquisitor_KnkL",
  cost: 3,
  type: "minion",
  attack: 0,
  health: 3,
  keywords: [],
  race: "Monster",
  rarity: "legendary",
  country: "Vatican",
  lore: "At the start of each of your turns, this card gains up to +3/+3 until it becomes 10/16, after it stops winning stats.",
  image: "art/High_Inquisitor_KnkL.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "buffSelf", attack: 3, health: 3, maxAttack: 10, maxHealth: 16 },
  ],
};
