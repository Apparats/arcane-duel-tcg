module.exports = {
  id: "expansion2:Baatus2",
  name: "Baatus",
  cost: 5,
  type: "minion",
  attack: 3,
  health: 9,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Netherlands",
  lore: "While Baatus is on the board, enemy minions are Drunk. Drunk minions attack a random minion on either side instead of the chosen target.",
  image: "art/Baatus2.webp",
  abilities: [
    { trigger: "passive", effect: "drunkAllMinions", enemyOnly: true },
  ],
};
