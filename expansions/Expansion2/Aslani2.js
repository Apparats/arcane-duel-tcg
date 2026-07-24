module.exports = {
  id: "expansion2:Aslani2",
  name: "Aslani",
  cost: 6,
  type: "minion",
  attack: 4,
  health: 10,
  keywords: [],
  race: "Monster",
  rarity: "legendary",
  country: "Belgium",
  lore: "Empress of Fire and Flame. Whenever this attacks a minion or hero, it applies Burning.",
  image: "art/Aslani2.webp",
  abilities: [
    { trigger: "onAttack", effect: "applyBurning", value: 1, turns: 2 },
  ],
};
