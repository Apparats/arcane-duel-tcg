module.exports = {
  id: "expansion2:Babu2",
  name: "Babu",
  cost: 10,
  type: "minion",
  attack: 4,
  health: 20,
  keywords: ["taunt"],
  race: "Monster",
  rarity: "legendary",
  country: "Belgium",
  lore: "On play, return your other board minions to your hand. While Babu is on your board, you cannot summon more minions, but you can still cast spells.",
  image: "art/Babu2.webp",
  abilities: [
    { trigger: "onPlay", effect: "returnOtherFriendlyMinionsToHand" },
  ],
};
