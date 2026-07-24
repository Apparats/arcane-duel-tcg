module.exports = {
  name: "Oil Bert",
  cost: 5,
  type: "minion",
  attack: 4,
  health: 6,
  keywords: [],
  race: "Human",
  rarity: "rare",
  country: "Germany",
  lore: "On play, if Oil Bert survives 2 turns, it gains +2/+2 once.",
  image: "art/Oil-Bert.webp",
  abilities: [
    { trigger: "onPlay", effect: "startDelayedSelfBuff", turns: 2, attack: 2, health: 2, firstPlayOnly: true },
  ],
};
