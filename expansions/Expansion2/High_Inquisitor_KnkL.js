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
  lore: "At the start of each of your turns after this is summoned, this card gains +3/+3. This can happen up to 4 times.",
  image: "art/High_Inquisitor_KnkL.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "buffSelf", attack: 3, health: 3, maxApplications: 4 },
  ],
};
