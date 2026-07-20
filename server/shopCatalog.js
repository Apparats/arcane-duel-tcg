const fs = require("fs");
const path = require("path");
const { CARDS } = require("../public/cards");
const { PACK_RARITY_WEIGHTS } = require("./cardRewards");
const { PACK_PRICE_GOLD, PACK_SIZE } = require("./db");
const { assertMongoKeySegment, sanitizeString } = require("./mongoSafety");
const { getShopPackSettings, isShopExpansion } = require("./expansionPack");

const EXPANSIONS_DIR = path.join(__dirname, "..", "expansions");
const MAX_PACK_PRICE_GOLD = 100000;
const MAX_PACK_SIZE = 20;

function readExpansionMeta(dir) {
  const metaPath = path.join(EXPANSIONS_DIR, dir, "expansion.json");
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, "utf8"));
}

function cardsForExpansion(expansionId) {
  return CARDS.filter((card) => card.id && card.id.startsWith(`${expansionId}:`));
}

function getShopPacks() {
  return fs
    .readdirSync(EXPANSIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readExpansionMeta(entry.name))
    .filter(isShopExpansion)
    .map((meta) => {
      const expansionId = assertMongoKeySegment(meta.id, "expansion id");
      const settings = getShopPackSettings(meta, {
        defaultPrice: PACK_PRICE_GOLD,
        defaultSize: PACK_SIZE,
        maxPrice: MAX_PACK_PRICE_GOLD,
        maxSize: MAX_PACK_SIZE,
        publicDir: path.join(__dirname, "..", "public"),
      });

      return {
        id: expansionId,
        name: sanitizeString(settings.packName, { label: "pack name", max: 80 }),
        expansionId,
        expansionName: sanitizeString(meta.name || expansionId, { label: "expansion name", max: 80 }),
        description: sanitizeString(meta.description || "", { label: "pack description", max: 240 }),
        priceGold: settings.packPriceGold,
        size: settings.packSize,
        art: settings.packArt,
        cards: cardsForExpansion(expansionId),
      };
    })
    .filter((pack) => pack.cards.length > 0);
}

function getShopPack(packId) {
  return getShopPacks().find((pack) => pack.id === packId);
}

function getStarterCardPool() {
  const byId = new Map();
  getShopPacks().forEach((pack) => {
    pack.cards.forEach((card) => byId.set(card.id, card));
  });
  return [...byId.values()];
}

function toPublicPack(pack) {
  return {
    id: pack.id,
    name: pack.name,
    expansionId: pack.expansionId,
    expansionName: pack.expansionName,
    description: pack.description,
    priceGold: pack.priceGold,
    size: pack.size,
    art: pack.art,
    cardCount: pack.cards.length,
    rarityWeights: { ...PACK_RARITY_WEIGHTS },
    // The client already has the public card catalog. IDs keep this response
    // compact while precisely describing which cards can come from this pack.
    cardIds: pack.cards.map((card) => card.id),
  };
}

module.exports = {
  getShopPacks,
  getShopPack,
  getStarterCardPool,
  toPublicPack,
};
