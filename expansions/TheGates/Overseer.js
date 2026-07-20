module.exports = {
  name: "Overseer",
  cost: 3,
  type: "minion",
  attack: 4,
  health: 6,
  keywords: [],
  race: "Monster",
  rarity: "mythic",
  country: "Oman",
  lore: "On its first death, deal 20 damage to all minions, then return with 1 Health.",
  image: "art/Overseer.webp",
  abilities: [
    { trigger: "onDeath", effect: "damageAllMinions", value: 20, firstDeathOnly: true },
    { trigger: "onDeath", effect: "rebirthWithHealth", value: 1 },
  ],
};
