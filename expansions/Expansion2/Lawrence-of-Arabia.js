module.exports = {
  name: "Lawrence-of-Arabia",
  cost: 4,
  type: "minion",
  attack: 2,
  health: 10,
  keywords: [],
  race: "Monster",
  rarity: "legendary",
  country: "Yemen",
  lore: "At the start of each of your turns, add a random spell card to your hand.",
  image: "art/Lawrence-of-Arabia.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "addRandomSpellToHand" },
  ],
};
