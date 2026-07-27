module.exports = {
  name: "Cardinal Severin",
  cost: 5,
  type: "minion",
  attack: 3,
  health: 12,
  keywords: ["taunt"],
  race: "Human",
  rarity: "mythic",
  country: "Thailand",
  lore: "On play and at the start of your turns, silence all enemy minions.",
  image: "art/Cardinal_Severin.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatusToAllEnemyMinions", status: "silenced" },
    { trigger: "onTurnStart", effect: "applyStatusToAllEnemyMinions", status: "silenced" },
  ],
};
