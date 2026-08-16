module.exports = {
  name: "Cardinal Severin",
  cost: 5,
  type: "minion",
  attack: 3,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "mythic",
  country: "Thailand",
  lore: "On play, silence all enemy minions. At the start of your turn, silence a random enemy minion.",
  image: "art/Cardinal_Severin.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatusToAllEnemyMinions", status: "silenced" },
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "silenced" },
  ],
};
