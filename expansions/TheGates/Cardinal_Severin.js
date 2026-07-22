module.exports = {
  name: "Cardinal Severin",
  cost: 7,
  type: "minion",
  attack: 3,
  health: 13,
  keywords: ["taunt"],
  race: "Human",
  rarity: "mythic",
  country: "Thailand",
  lore: "On play and at the start of each of your turns, silence an enemy minion.",
  image: "art/Cardinal_Severin.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "silenced" },
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "silenced" },
  ],
};
