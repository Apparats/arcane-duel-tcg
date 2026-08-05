module.exports = {
  name: "sinistersmiley",
  cost: 6,
  type: "minion",
  attack: 6,
  health: 6,
  keywords: [],
  race: "Human",
  rarity: "rare",
  country: "South Africa",
  lore: "On play, choose a card to give it Divine Shield.",
  image: "art/SinisterSmiley.webp",
  abilities: [
    { trigger: "onPlay", effect: "grantDivineShieldToTargetMinion", target: "minion" },
  ],
};
