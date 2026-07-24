module.exports = {
  name: "Crowley_The_Penguin",
  cost: 8,
  type: "minion",
  attack: 2,
  health: 14,
  keywords: ["taunt"],
  race: "Monster",
  rarity: "legendary",
  country: "Vatican",
  lore: "On its first play, Crowley shields every friendly minion from the next hit.",
  image: "art/Crowley_THE_Penguin.webp",
  abilities: [
    { trigger: "onPlay", effect: "grantDivineShieldToAllFriendlyMinions", firstPlayOnly: true },
  ],
};
