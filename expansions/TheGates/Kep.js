module.exports = {
  name: "Kep",
  cost: 5,
  type: "minion",
  attack: 5,
  health: 8,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Portugal",
  lore: "When Kep attacks a minion, it repeats that damage to another random enemy minion, or the enemy hero if none remain.",
  image: "art/Keps.webp",
  abilities: [
    { trigger: "onAttackMinion", effect: "damageRandomOtherEnemyMinionOrHero" },
  ],
};
