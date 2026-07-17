module.exports = {
  name: "Lolflame",
  cost: 3,
  type: "minion",
  attack: 3,
  health: 7,
  keywords: ["charge"], 
  race: "Monster",
  rarity: "mythic",
  country: "Djibouti",
  lore: "Charge. Whenever this attacks, deal 1 damage to all enemy minions.",
  image: "art/Lolflames.webp",
  abilities: [
    { trigger: "onAttack", effect: "damageAllEnemyMinions", value: 1 },
  ],
};
