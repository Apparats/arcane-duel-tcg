module.exports = {
  name: "masterchief",
  cost: 1,
  type: "minion",
  attack: 2,
  health: 8,
  keywords: [],
  race: "Monster",
  rarity: "legendary",
  country: "Oman",
  lore: "When this card kills another card, it gains Divine Shield. If it survives 3 turns, it becomes a 10/10 with Divine Shield.",
  image: "art/MasterChief.webp",
  abilities: [
    { trigger: "onKillMinion", effect: "grantSelfDivineShield" },
    { trigger: "onPlay", effect: "startDelayedSelfBuff", turns: 3, setAttack: 10, setHealth: 10, grantDivineShield: true },
  ],
};
