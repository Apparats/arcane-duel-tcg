module.exports = {
  name: "Mamaluteo",
  cost: 5,
  type: "minion",
  attack: 5,
  health: 9,
  keywords: [],
  race: "Monster",
  rarity: "legendary",
  country: "Bolivia",
  lore: "On play, poison an enemy minion or hero. At the start of your turns, poison 1 random enemy minion.",
  image: "art/mamaluteo.webp",
  abilities: [
    { trigger: "onPlay", effect: "applyStatus", target: "enemy", status: "poisoned", value: 2, turns: 6 },
    { trigger: "onTurnStart", effect: "applyStatusToRandomEnemyMinion", status: "poisoned", value: 2, turns: 6 },
  ],
};
