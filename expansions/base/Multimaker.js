module.exports = {
  name: "Multimaker",
  cost: 6,
  type: "minion",
  attack: 1,
  health: 8,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Arcana",
  lore: "Has no flag, but always a plan B. At the start of your turn, summon a Multi.",
  image: "art/Multimaker.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "summonMinion", cardId: "special:multi", count: 1 },
  ],
};
