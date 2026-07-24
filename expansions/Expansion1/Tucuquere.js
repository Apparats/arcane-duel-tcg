module.exports = {
  name: "Tucuquere",
  cost: 5,
  type: "minion",
  attack: 7,
  health: 3,
  keywords: [],
  race: "Human",
  rarity: "rare",
  country: "Chile",
  lore: "Whenever Tucuquere destroys a minion, it gains Divine Shield.",
  image: "art/Tucuquere.webp",
  abilities: [
    { trigger: "onKillMinion", effect: "grantSelfDivineShield" },
  ],
};
