module.exports = {
  name: "GoldenWarerita",
  cost: 4,
  type: "minion",
  attack: 3,
  health: 8,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Arcana",
  lore: "When this card dies, transform it into a normal Warerita on the board.",
  image: "art/GoldenWarerita.webp",
  abilities: [
    { trigger: "onDeath", effect: "transformIntoMinion", cardId: "base:warerita" },
  ],
};
