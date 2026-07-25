module.exports = {
  name: "Cardinal Severin",
  cost: 6,
  type: "minion",
  attack: 3,
  health: 13,
  keywords: ["taunt"],
  race: "Human",
  rarity: "legendary",
  country: "Thailand",
  lore: "On first play, silence all enemy minions.",
  image: "art/Cardinal_Severin.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatusToAllEnemyMinions", status: "silenced", firstPlayOnly: true },
  ],
};
