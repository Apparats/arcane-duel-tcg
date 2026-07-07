// Ejemplo de un hechizo que funciona ENTERAMENTE por "abilities", sin
// "effect"/"value" clásicos (esos solo pegan a un objetivo). Este no
// pide objetivo: golpea a TODAS las criaturas rivales a la vez, o sea,
// "hace daño contra más cartas".
module.exports = {
  name: "Onda de Escarcha",
  cost: 4,
  type: "spell",
  // Sin "effect": este hechizo no tiene daño de objetivo único, solo
  // la habilidad de abajo. El cliente no pide objetivo cuando pasa esto.

  abilities: [{ trigger: "onPlay", effect: "damageAllEnemyMinions", value: 2 }],

  rarity: "rare",
  country: "Arcana",
  lore: "El frío no elige a quién golpear.",
};
