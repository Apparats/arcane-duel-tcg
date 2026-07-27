module.exports = {
  name: "Red",
  cost: 6,
  type: "minion",
  attack: 0,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Vatican",
  lore: "At the start of each of your turns, Red calls RedWolf if the pack is gone.",
  image: "art/Red.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "summonMinionIfMissing", cardId: "special:redwolf" },
  ],
};
