module.exports = {
  name: "snowman",
  cost: 6,
  type: "minion",
  attack: 3,
  health: 8,
  keywords: ["taunt"],
  race: "Monster",
  rarity: "rare",
  country: "Portugal",
  lore: "Taunt. When this card is attacked, the attacker is Frozen for 2 turns.",
  image: "art/SnowMan.webp",
  abilities: [
    { trigger: "onAttacked", effect: "applyStatusToAttacker", status: "frozen", turns: 2 },
  ],
};
