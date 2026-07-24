module.exports = {
  name: "Baatus",
  cost: 2,
  type: "minion",
  attack: 0,
  health: 6,
  keywords: ["taunt"],
  race: "Monster",
  rarity: "rare",
  country: "Netherlands",
  lore: "Whenever a minion attacks Baatus, that attacker becomes Drunk until the end of its next turn.",
  image: "art/Baatus.webp",
  abilities: [
    { trigger: "onAttacked", effect: "applyDrunkToAttacker", turns: 2 },
  ],
};
