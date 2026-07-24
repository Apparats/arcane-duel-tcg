module.exports = {
  name: "Meow4glory",
  cost: 4,
  type: "minion",
  attack: 2,
  health: 8,
  keywords: [],
  race: "Monster",
  rarity: "rare",
  country: "Ukraine",
  lore: "On play, if Meow4glory is joined by 3 other friendly minions, swap its stats.",
  image: "art/Meow4Glory.webp",
  abilities: [
    { trigger: "onPlay", effect: "swapSelfStatsIfBoardHasAtLeast", value: 4 },
  ],
};
