module.exports = {
  name: "Crowley_The_Penguin",
  cost: 6,
  type: "minion",
  attack: 2,
  health: 12,
  keywords: ["taunt"],
  race: "Monster",
  rarity: "mythic",
  country: "Vatican",
  lore: "On its first play, Crowley shields every friendly minion from the next hit.",
  image: "art/Crowley_THE_Penguin.webp",
  abilities: [
    { trigger: "onPlay", effect: "grantDivineShieldToAllFriendlyMinions", firstPlayOnly: true },
  ],
};
