module.exports = {
  name: "GoldenWarerita",
  cost: 4,
  type: "minion",
  attack: 3,
  health: 7,
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