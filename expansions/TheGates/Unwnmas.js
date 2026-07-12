module.exports = {
  name: "Unwnmas",
  cost: 6,
  type: "minion",
  attack: 3,
  health: 6,
  keywords: ["charge"],
  race: "Monster",
  rarity: "mythic",
  country: "Chile",
  lore: "Whenever this attacks a minion or the enemy hero, deal 3 damage to the enemy hero. This card can instantly attack when prepared.",
  image: "art/Unwnmas.webp",
  abilities: [
    { trigger: "onAttack", effect: "damageEnemyHero", value: 3 },
  ],
};
