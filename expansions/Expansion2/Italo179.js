module.exports = {
  name: "Italo179",
  cost: 4,
  type: "minion",
  attack: 4,
  health: 6,
  keywords: [],
  race: "Human",
  rarity: "rare",
  country: "Brazil",
  lore: "Takes no damage from Monster cards.",
  image: "art/Italo179.webp",
  abilities: [
    { trigger: "passive", effect: "preventDamageFromRace", race: "Monster" },
  ],
};
