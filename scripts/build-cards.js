#!/usr/bin/env node
// ============================================================
// CARD COMPILER
// ------------------------------------------------------------
// Gathers every card from expansions/<each-expansion>/*.js and
// generates public/cards.js — the file the engine (server and
// browser) uses at runtime. It doesn't run during the game, it's
// an authoring tool: you change a card, you run this, done. It's
// the equivalent of "compiling the plugin" before dropping it on
// a Minecraft server.
//
// Usage:
//   node scripts/build-cards.js            builds and writes public/cards.js
//   npm run cards:build                    (same command, shorter)
//   node scripts/build-cards.js --check    validates everything without writing
//   node scripts/build-cards.js --watch    rebuilds only when a file changes
// ============================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const EXPANSIONS_DIR = path.join(ROOT, "expansions");
const OUTPUT_FILE = path.join(ROOT, "public", "cards.js");

const VALID_TYPES = ["minion", "spell"];
const VALID_KEYWORDS = ["taunt", "charge", "divineShield"];
const VALID_EFFECTS = ["damage", "heal", "draw"];
const VALID_RARITIES = ["common", "rare", "legendary", "mythic"];
const MAX_LORE_LENGTH = 180;

// Must exactly mirror the effects implemented in the ABILITY_EFFECTS
// object in public/engine.js. If you add a new effect there, add it
// here too (and to the required-parameters list below).
const VALID_TRIGGERS = ["onPlay", "onDeath", "onTurnStart", "onAnyTurnStart", "onAttackMinion"];
const VALID_ABILITY_EFFECTS = [
  "drawCards",
  "damageAllEnemyMinions",
  "damageAllMinions",
  "damageEnemyHero",
  "healAllFriendlyMinions",
  "summonMinion",
  "buffAllFriendlyMinions",
  "healSelf",
  "returnToDeck",
  "returnToDeckIfPlayedLessThan",
  "destroySelf",
  "destroySelfIfPlayedAtLeast",
];

class BuildError extends Error {}

function fail(msg) {
  throw new BuildError(msg);
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strips accents/diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function relLabel(filePath) {
  return path.relative(ROOT, filePath);
}

function isIntegerInRange(value, min, max = Number.MAX_SAFE_INTEGER) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function loadExpansionMeta(expansionDir) {
  const metaPath = path.join(expansionDir, "expansion.json");
  const label = relLabel(expansionDir);
  if (!fs.existsSync(metaPath)) {
    fail(
      `Expansion "${label}" has no expansion.json. Every folder ` +
        `inside expansions/ needs one (it defines the expansion's id ` +
        `and name). See expansions/core/expansion.json for an example.`
    );
  }
  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch (err) {
    fail(`Invalid expansion.json in "${label}": ${err.message}`);
  }
  if (!meta.id || typeof meta.id !== "string") {
    fail(`expansion.json in "${label}" needs an "id" field (string, no spaces).`);
  }
  return meta;
}

function loadCard(filePath, expansionMeta) {
  const label = relLabel(filePath);
  delete require.cache[require.resolve(filePath)];

  let card;
  try {
    card = require(filePath);
  } catch (err) {
    fail(`Couldn't load ${label}:\n  ${err.message}`);
  }

  if (typeof card !== "object" || card === null || Array.isArray(card)) {
    fail(`${label}: must export a single card object (module.exports = { ... }).`);
  }

  if (!card.id) {
    const slug = slugify(path.basename(filePath, ".js"));
    card = Object.assign({}, card, { id: `${expansionMeta.id}:${slug}` });
  }
  card = Object.assign({}, card, { _expansionId: expansionMeta.id });

  validateCard(card, label);
  return card;
}

function validateCard(card, label) {
  if (!card.name || typeof card.name !== "string") {
    fail(`${label}: missing "name" (must be text).`);
  }
  if (!isIntegerInRange(card.cost, 0, 20)) {
    fail(`${label}: "cost" must be an integer between 0 and 20.`);
  }
  if (!VALID_TYPES.includes(card.type)) {
    fail(`${label}: "type" must be "minion" or "spell" (found: ${JSON.stringify(card.type)}).`);
  }

  // ---- Presentation fields (shared by minions and spells) ----
  if (!VALID_RARITIES.includes(card.rarity)) {
    fail(`${label}: "rarity" must be one of ${VALID_RARITIES.join(", ")} (found: ${JSON.stringify(card.rarity)}).`);
  }
  if (!card.country || typeof card.country !== "string") {
    fail(`${label}: missing "country" (string, e.g. "Arcana").`);
  }
  if (!card.lore || typeof card.lore !== "string") {
    fail(`${label}: missing "lore" (short flavor text).`);
  }
  if (card.lore.length > MAX_LORE_LENGTH) {
    fail(`${label}: "lore" is too long (${card.lore.length} characters, max ${MAX_LORE_LENGTH}). Keep it short, it's for a tooltip.`);
  }
  if (card.image !== undefined && card.image !== null && typeof card.image !== "string") {
    fail(`${label}: "image" must be a string (path or URL) if you include it — or just leave it out.`);
  }

  if (card.type === "minion") {
    if (!isIntegerInRange(card.attack, 0, 99)) {
      fail(`${label}: the minion needs "attack" (integer between 0 and 99).`);
    }
    if (!isIntegerInRange(card.health, 1, 99)) {
      fail(`${label}: the minion needs "health" (integer between 1 and 99).`);
    }
    if (!card.race || typeof card.race !== "string") {
      fail(`${label}: the minion needs "race" (string, e.g. "Human" — make up whatever you want).`);
    }
    const keywords = card.keywords || [];
    if (!Array.isArray(keywords)) {
      fail(`${label}: "keywords" must be an array (can be empty []).`);
    }
    keywords.forEach((k) => {
      if (!VALID_KEYWORDS.includes(k)) {
        fail(`${label}: unknown keyword "${k}". Valid: ${VALID_KEYWORDS.join(", ")}.`);
      }
    });
  }

  if (card.type === "spell") {
    const hasAbilities = Array.isArray(card.abilities) && card.abilities.length > 0;
    if (card.effect !== undefined || !hasAbilities) {
      // A "classic" spell (or any spell without abilities) needs effect/value.
      if (!VALID_EFFECTS.includes(card.effect)) {
        fail(`${label}: "effect" must be one of ${VALID_EFFECTS.join(", ")} (found: ${JSON.stringify(card.effect)}). If the spell works purely through "abilities", omit "effect" entirely.`);
      }
      if (!isIntegerInRange(card.value, 1, 99)) {
        fail(`${label}: "value" must be an integer between 1 and 99.`);
      }
    }
  }

  validateAbilities(card, label);
}

// ============================================================
// ABILITIES — validation for the optional "abilities" field.
// Must mirror the actual effects implemented in the
// ABILITY_EFFECTS object in public/engine.js.
// ============================================================
function validateAbilities(card, label) {
  if (card.abilities === undefined) return;
  if (!Array.isArray(card.abilities)) {
    fail(`${label}: "abilities" must be an array.`);
  }

  card.abilities.forEach((ability, idx) => {
    const abLabel = `${label} (abilities[${idx}])`;

    if (typeof ability !== "object" || ability === null) {
      fail(`${abLabel}: each ability must be an object { trigger, effect, ... }.`);
    }
    if (!VALID_TRIGGERS.includes(ability.trigger)) {
      fail(`${abLabel}: "trigger" must be one of ${VALID_TRIGGERS.join(", ")} (found: ${JSON.stringify(ability.trigger)}).`);
    }
    if (!VALID_ABILITY_EFFECTS.includes(ability.effect)) {
      fail(`${abLabel}: unknown effect "${ability.effect}". Valid: ${VALID_ABILITY_EFFECTS.join(", ")}.`);
    }

    if (ability.effect === "summonMinion") {
      if (!ability.cardId || typeof ability.cardId !== "string") {
        fail(`${abLabel}: summonMinion needs "cardId" (the id of the card to summon, e.g. "core:recluta-novato").`);
      }
      if (ability.count !== undefined && !isIntegerInRange(ability.count, 1, 20)) {
        fail(`${abLabel}: "count" must be an integer between 1 and 20 if you include it.`);
      }
    } else if (ability.effect === "buffAllFriendlyMinions") {
      if (ability.attack === undefined && ability.health === undefined) {
        fail(`${abLabel}: buffAllFriendlyMinions needs at least "attack" or "health".`);
      }
      if (ability.attack !== undefined && !isIntegerInRange(ability.attack, -99, 99)) {
        fail(`${abLabel}: "attack" must be an integer between -99 and 99.`);
      }
      if (ability.health !== undefined && !isIntegerInRange(ability.health, -99, 99)) {
        fail(`${abLabel}: "health" must be an integer between -99 and 99.`);
      }
    } else if (["returnToDeck", "destroySelf"].includes(ability.effect)) {
      // No extra params required.
    } else {
      // drawCards, damageAllEnemyMinions, damageAllMinions, damageEnemyHero,
      // healAllFriendlyMinions, healSelf, returnToDeckIfPlayedLessThan,
      // destroySelfIfPlayedAtLeast
      if (!isIntegerInRange(ability.value, 1, 99)) {
        fail(`${abLabel}: "value" must be an integer between 1 and 99 for effect "${ability.effect}".`);
      }
    }
  });
}

function collectCards() {
  if (!fs.existsSync(EXPANSIONS_DIR)) {
    fail(`"expansions/" folder doesn't exist. Create at least one (see expansions/core as an example).`);
  }

  const expansionDirs = fs
    .readdirSync(EXPANSIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(EXPANSIONS_DIR, d.name))
    .sort();

  if (expansionDirs.length === 0) {
    fail(`"expansions/" is empty. Create at least one expansion (see expansions/core as an example).`);
  }

  const allCards = [];
  const seenIds = new Map(); // id -> file where it first appeared

  expansionDirs.forEach((dir) => {
    const meta = loadExpansionMeta(dir);

    if (meta.enabled === false) {
      console.log(`⏭  "${meta.id}" disabled (enabled: false in expansion.json) — skipping.`);
      return;
    }

    const cardFiles = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".js"))
      .sort()
      .map((f) => path.join(dir, f));

    cardFiles.forEach((filePath) => {
      const card = loadCard(filePath, meta);
      const label = relLabel(filePath);

      if (seenIds.has(card.id)) {
        fail(
          `Duplicate card id "${card.id}" in ${label} ` +
            `(already used by ${seenIds.get(card.id)}). Ids must be unique across ALL expansions.`
        );
      }
      seenIds.set(card.id, label);
      allCards.push(card);
    });

    console.log(`✔ "${meta.id}"${meta.name ? ` (${meta.name})` : ""}: ${cardFiles.length} card(s)`);
  });

  if (allCards.length === 0) {
    fail(`No enabled cards were found in expansions/. Check that no folder is empty or disabled.`);
  }

  // Cross-check: summonMinion abilities must point at a card that
  // really exists among EVERYTHING compiled (it might live in another
  // expansion — that's why this is only checked here, at the end).
  allCards.forEach((card) => {
    (card.abilities || []).forEach((ability) => {
      if (ability.effect === "summonMinion" && !seenIds.has(ability.cardId)) {
        fail(
          `Card "${card.id}" has a summonMinion ability referencing "${ability.cardId}", ` +
            `but that card doesn't exist in any enabled expansion.`
        );
      }
    });
  });

  return allCards;
}

function renderOutput(cards) {
  return `// ============================================================
// ⚠️  GENERATED FILE — DO NOT EDIT BY HAND.
// Generated with "npm run cards:build" from expansions/.
// To add, remove, or change cards, edit the files there and run
// the build again. See README.md → "Adding cards".
// ============================================================

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.TCGCards = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {

  const CARDS = ${JSON.stringify(cards, null, 2).replace(/\n/g, "\n  ")};

  function getCardById(id) {
    return CARDS.find((c) => c.id === id);
  }

  // Starter deck: 1 copy of each enabled card in expansions/.
  function buildStarterDeck() {
    return CARDS.map((c) => c.id);
  }

  return { CARDS, getCardById, buildStarterDeck };
});
`;
}

function runOnce({ checkOnly }) {
  try {
    const cards = collectCards();
    if (checkOnly) {
      console.log(`\n✅ ${cards.length} card(s) valid. (--check: public/cards.js was not written)\n`);
    } else {
      fs.writeFileSync(OUTPUT_FILE, renderOutput(cards), "utf8");
      console.log(`\n✅ ${cards.length} card(s) compiled → public/cards.js\n`);
    }
    return true;
  } catch (err) {
    if (err instanceof BuildError) {
      console.error(`\n❌ ${err.message}\n`);
    } else {
      console.error(`\n❌ Unexpected error: ${err.stack}\n`);
    }
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const watch = args.includes("--watch");

  const ok = runOnce({ checkOnly });
  if (!watch && !ok) process.exitCode = 1;

  if (watch) {
    console.log(`👀 Watching expansions/ — will rebuild only when you save a change (Ctrl+C to quit)\n`);
    fs.watch(EXPANSIONS_DIR, { recursive: true }, (_, filename) => {
      if (!filename || !filename.endsWith(".js") && !filename.endsWith(".json")) return;
      console.log(`↻ Change detected in ${filename}, rebuilding...`);
      runOnce({ checkOnly: false });
    });
  }
}

main();
