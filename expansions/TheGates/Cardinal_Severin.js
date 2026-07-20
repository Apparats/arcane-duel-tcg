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
  lore: "On play, silence an enemy minion. A wall of doctrine against any engine.",
  image: "art/Cardinal_Severin.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemyMinion", status: "silenced" },
  ],
};
