// Ejemplo de habilidad "onPlay" en una criatura (equivalente a un
// "battlecry"): al entrar en juego, roba una carta extra para quien
// la jugó. Así se ve un efecto que "genera más cartas".
module.exports = {
  name: "Bibliotecario Errante",
  cost: 3,
  type: "minion",
  attack: 2,
  health: 3,
  keywords: [],
  race: "Humano",

  abilities: [{ trigger: "onPlay", effect: "drawCards", value: 1 }],

  rarity: "rare",
  country: "Arcana",
  lore: "Carga consigo más libros de los que puede leer en una vida.",
};
