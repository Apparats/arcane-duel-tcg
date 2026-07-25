module.exports = {
  name: "Jubx4",
  cost: 5,
  type: "minion",
  attack: 4,
  health: 10,
  keywords: [],
  race: "Human",
  rarity: "legendary",
  country: "Iraq",
  lore: "First play grants Dodge: 40% to Jubx4, 30% to allies. Whenever an enemy card dies from any source while Jubx4 is on your board, Jubx4's Dodge rises by 5%, up to 60%.",
  image: "art/Jubx4.webp",
  abilities: [
    { trigger: "onPlay", effect: "grantDodgeToFriendlyBoardFirstPlay", selfValue: 40, value: 30, firstPlayOnly: true },
    { trigger: "onEnemyMinionDeath", effect: "increaseSelfDodgeOnEnemyDeath", value: 5, maxValue: 60 },
  ],
};
