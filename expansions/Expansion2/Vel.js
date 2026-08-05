module.exports = {
  name: "Vel",
  cost: 3,
  type: "minion",
  attack: 3,
  health: 2,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "Mali",
  lore: "On play, gives +1 Attack to all friendly Human cards.",
  image: "art/Vel.webp",
  abilities: [
    { trigger: "onPlay", effect: "buffFriendlyRaceMinions", race: "Human", attack: 1 },
  ],
};
