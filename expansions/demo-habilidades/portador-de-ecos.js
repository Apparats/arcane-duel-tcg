// Ejemplo de habilidad "onDeath" (equivalente a un "deathrattle"): al
// morir, invoca una copia de otra carta ya existente (referenciada por
// su id) en el tablero de su dueño. Muestra cómo una carta puede
// referenciar a otra por id — el build valida que ese id exista de
// verdad entre TODAS las expansiones habilitadas.
module.exports = {
  name: "Portador de Ecos",
  cost: 3,
  type: "minion",
  attack: 2,
  health: 2,
  keywords: [],
  race: "Espíritu",

  abilities: [
    { trigger: "onDeath", effect: "summonMinion", cardId: "core:recluta-novato", count: 1 },
  ],

  rarity: "rare",
  country: "Arcana",
  lore: "Lo que deja atrás siempre pesa más que lo que fue.",
};
