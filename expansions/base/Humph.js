module.exports = {
  name: "Humph",
  cost: 5,
  type: "minion",
  attack: 5,
  health: 8,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Ireland",
  lore: "When this kills a minion, gain 2 extra Mana on your next turn.",
  image: "art/Humph.webp",
  abilities: [
    { trigger: "onKillMinion", effect: "grantNextTurnTemporaryMana", value: 2 },
  ],
};
