module.exports = {
  name: "Knud_the_Dorf",
  cost: 4,
  type: "minion",
  attack: 4,
  health: 6,
  keywords: [],
  race: "Monster",
  rarity: "legendary",
  country: "Denmark",
  lore: "Takes no damage from Human cards.",
  image: "art/Knud_the_Dorf.webp",
  abilities: [
    { trigger: "passive", effect: "preventDamageFromRace", race: "Human" },
  ],
};
