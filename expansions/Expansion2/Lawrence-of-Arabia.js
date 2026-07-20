module.exports = {
  name: "Lawrence-of-Arabia",
  cost: 6,
  type: "minion",
  attack: 2,
  health: 12,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Yemen",
  lore: "At the start of each of your turns, add a random spell card to your hand.",
  image: "art/Lawrence-of-Arabia.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "addRandomSpellToHand" },
  ],
};
