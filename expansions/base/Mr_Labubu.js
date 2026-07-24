module.exports = {
  name: "Mr Labubu",
  cost: 5,
  type: "minion",
  attack: 7,
  health: 2,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "Germany",
  lore: "Whenever Mr Labubu destroys a minion and survives, it gains Charge.",
  image: "art/Mr_Labubu.webp",
  abilities: [
    { trigger: "onKillMinion", effect: "grantSelfCharge" },
  ],
};
