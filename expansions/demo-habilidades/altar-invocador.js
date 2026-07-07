// Example of the "onTurnStart" trigger: fires at the start of the
// controlling player's turn, for as long as this minion is alive —
// not just once. This is how you make a card summon a specific card
// every turn (as opposed to onPlay/onDeath, which only fire once).
module.exports = {
  name: "Altar Invocador",
  cost: 3,
  type: "minion",
  attack: 1,
  health: 4,
  keywords: ["taunt"], // protects it so it survives to keep summoning
  race: "Constructo",

  abilities: [
    { trigger: "onTurnStart", effect: "summonMinion", cardId: "core:recluta-novato", count: 1 },
  ],

  rarity: "legendary",
  country: "Arcana",
  lore: "Cada amanecer, otro más responde al llamado.",
};
