module.exports = {
  name: "Lolflame",
  cost: 5,
  type: "minion",
  attack: 3,
  health: 6,
  keywords: ["charge"], 
  race: "Monster",
  rarity: "mythic",
  country: "Djibouti",
  lore: "This card can instantly attack when prepared. This card also deals +1 damage to all enemy cards.",
  image: "art/Lolflames.webp",
  abilities: [
    { trigger: "onAttackMinion", effect: "damageAllEnemyMinions", value: 1 },
  ],
};
