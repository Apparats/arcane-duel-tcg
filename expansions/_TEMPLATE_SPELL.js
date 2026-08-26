// ============================================================
// TEMPLATE — SPELL
// Copy this file into your expansion's folder
// (e.g. expansions/my-expansion/my-spell.js) and fill in the fields.
// This particular file does NOT get compiled: it lives loose at the
// root of expansions/, and the build only looks inside subfolders.
// ============================================================

module.exports = {
  // "id" is OPTIONAL. If you don't set it, it's generated automatically
  // as "<expansion-id>:<this-filename>".

  name: "Spell Name",
  cost: 2,           // mana required (number >= 0)
  type: "spell",     // fixed: "spell"

  // effect: OPTIONAL — one of these three. Only needed for a "classic"
  // single-target spell. If your spell works entirely through
  // "abilities" instead (see below), just omit "effect" and "value"
  // completely — the player won't be asked to pick a target for it.
  //   "damage" -> "value" is how much damage it deals (to a target or face)
  //   "heal"   -> "value" is how much health it restores (to a target or your hero)
  //   "draw"   -> "value" is how many cards it draws (no target needed)
  effect: "damage",
  value: 3,          // number > 0

  // ---- Presentation fields (shown when hovering over the card) ----
  // DISCLAIMER: Community cards must be "common", "rare", or "souvenir".
  // "legendary" and "mythic" are strictly exclusive to the game creator.
  rarity: "common",   // "common" | "rare" | "souvenir"
  country: "Arcana",  // the card's country/faction (pick whichever you want)
  lore: "A short flavor line, no more than a couple of sentences.",

  // "image" is OPTIONAL. Path relative to public/ (recommended: "art/my-spell.webp", 1:1 square)
  // or a URL. If you leave it out, the card shows a generic icon based
  // on its type — nothing breaks if you skip it.
  // See README.md / CONTRIBUTING.md for the official AI art generation prompt template!
  // image: "art/frost-bolt.webp",

  // "abilities" is OPTIONAL — extra effects beyond (or instead of) the
  // classic effect/value above, e.g. AoE damage to every enemy minion.
  // See the "Abilities" section in README.md for the full list of
  // effects the engine already knows.
  // abilities: [
  //   { trigger: "onPlay", effect: "damageAllEnemyMinions", value: 2 },
  // ],
};
