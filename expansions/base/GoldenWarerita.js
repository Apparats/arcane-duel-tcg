module.exports = {
  name: "GoldenWarerita",
  cost: 3,
  type: "minion",
  attack: 2,
  health: 6,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Arcana",
  lore: "Golden Warerita! After dying, it turns into a normal warerita.",
  image: "art/GoldenWarerita.webp",
  abilities: [
    { trigger: "onDeath", effect: "summonMinion", cardId: "base:warerita", count: 1 },
  ],
};