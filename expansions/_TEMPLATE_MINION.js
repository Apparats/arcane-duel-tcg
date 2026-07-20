// ============================================================
// TEMPLATE — MINION
// Copy this file into your expansion's folder
// (e.g. expansions/my-expansion/my-card.js) and fill in the fields.
// This particular file does NOT get compiled: it lives loose at the
// root of expansions/, and the build only looks inside subfolders.
// ============================================================

module.exports = {
  // "id" is OPTIONAL. If you don't set it, it's generated automatically
  // as "<expansion-id>:<this-filename>".
  // E.g.: this file at expansions/promo/obsidian-golem.js
  // -> final id: "promo:obsidian-golem"
  // You only need to set "id" by hand if you want a specific one.

  name: "Minion Name", // free text, shown on the card
  cost: 3,              // mana required to play it (number >= 0)
  type: "minion",        // fixed: "minion"
  attack: 3,             // attack (number >= 0)
  health: 4,              // health (number >= 1)

  // keywords: array, can be left empty []. Valid values:
  //   "taunt"        -> the opponent must attack it before anything else
  //   "charge"       -> can attack the same turn it's played
  //   "divineShield" -> ignores the first hit of damage it takes
  keywords: [],

  // "race" is free text — put whatever you want, there's no fixed list
  // (e.g. "Human", "Dragon", "Construct", "Elemental", whatever fits).
  race: "Human",

  // ---- Presentation fields (shown when hovering over the card) ----
  rarity: "common",   // "common" | "rare" | "legendary" | "mythic" | "souvenir"
  country: "Arcana",  // the card's country/faction (pick whichever you want)
  lore: "A short flavor line, no more than a couple of sentences.",

  // "image" is OPTIONAL. Path relative to public/ (e.g. "art/my-card.png")
  // or a URL. If you leave it out, the card shows a generic icon based
  // on its type — nothing breaks if you skip it.
  // image: "art/obsidian-golem.png",

  // "abilities" is OPTIONAL — special effects beyond plain stats
  // (e.g. "draw a card when played", "deal damage to all enemies",
  // "summon a specific card every turn while this is alive").
  // See the "Abilities" section in README.md for the full list of
  // effects the engine already knows. Leave this out entirely if the
  // card is just plain stats — most cards don't need it.
  // abilities: [
  //   { trigger: "onPlay", effect: "drawCards", value: 1 },
  // ],
};
