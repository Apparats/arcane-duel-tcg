const fs = require("fs");
const path = require("path");
const { CARDS } = require("../public/cards");
const { PACK_PRICE_GOLD, PACK_SIZE } = require("./db");
const { assertMongoKeySegment, assertPositiveInteger, sanitizeString } = require("./mongoSafety");

const EXPANSIONS_DIR = path.join(__dirname, "..", "expansions");
const MAX_PACK_PRICE_GOLD = 100000;
const MAX_PACK_SIZE = 20;

function readExpansionMeta(dir) {
  const metaPath = path.join(EXPANSIONS_DIR, dir, "expansion.json");
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, "utf8"));
}

function isShopExpansion(meta) {
  return meta && meta.enabled !== false && (meta.shop === true || meta.availableInShop === true);
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
      const priceGold = assertPositiveInteger(meta.packPriceGold ?? PACK_PRICE_GOLD, "pack price", {
        min: 1,
        max: MAX_PACK_PRICE_GOLD,
      });
      const size = assertPositiveInteger(meta.packSize ?? PACK_SIZE, "pack size", {
        min: 1,
        max: MAX_PACK_SIZE,
      });

      return {
        id: expansionId,
        name: sanitizeString(meta.packName || `${meta.name || expansionId} Pack`, { label: "pack name", max: 80 }),
        expansionId,
        expansionName: sanitizeString(meta.name || expansionId, { label: "expansion name", max: 80 }),
        description: sanitizeString(meta.description || "", { label: "pack description", max: 240 }),
        priceGold,
        size,
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
    cardCount: pack.cards.length,
  };
}

module.exports = {
  getShopPacks,
  getShopPack,
  getStarterCardPool,
  toPublicPack,
};
