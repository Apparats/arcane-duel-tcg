module.exports = {
  name: "Multimaker",
  cost: 7,
  type: "minion",
  attack: 1,
  health: 9,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Arcana",
  lore: "Has no flag, but always a plan B. This card spawns on the deck a multi card every turn",
  image: "art/Multimaker.webp",
  abilities: [
    { trigger: "onAnyTurnStart", effect: "summonMinion", cardId: "special:multi", count: 1 },
  ],
};
