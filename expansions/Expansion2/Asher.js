module.exports = {
  name: "asher",
  cost: 3,
  type: "minion",
  attack: 3,
  health: 2,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "Cambodia",
  lore: "On play, heals all friendly Monster cards for 1.",
  image: "art/Asher.webp",
  abilities: [
    { trigger: "onPlay", effect: "healFriendlyRaceMinions", race: "Monster", value: 1 },
  ],
};
