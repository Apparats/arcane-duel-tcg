module.exports = {
  name: "masterchief",
  cost: 4,
  type: "minion",
  attack: 2,
  health: 5,
  keywords: [],
  race: "Monster",
  rarity: "legendary",
  country: "Oman",
  lore: "When this card kills another card, it gains Divine Shield. If it survives 4 turns, it becomes a 10/10.",
  image: "art/MasterChief.webp",
  abilities: [
    { trigger: "onKillMinion", effect: "grantSelfDivineShield" },
    { trigger: "onPlay", effect: "startDelayedSelfBuff", turns: 4, setAttack: 10, setHealth: 10, grantDivineShield: false },
  ],
};
