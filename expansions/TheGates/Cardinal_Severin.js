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
  lore: "At the start of your next turn, silence 1 random enemy minion once.",
  image: "art/Cardinal_Severin.webp",
  abilities: [
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "silenced", oncePerMinion: true },
  ],
};
