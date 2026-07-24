module.exports = {
  name: "ArchMoth_Morlet",
  cost: 6,
  type: "minion",
  attack: 2,
  health: 10,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Vatican",
  lore: "I send moths! When summoned, this card spawns 2 special Moths cards.",
  image: "art/ArchMoth_Morlet.webp",
  abilities: [
    { trigger: "onPlay", effect: "summonMinion", cardId: "special:moths", count: 2 },
  ],
};
