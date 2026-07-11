const fs = require("fs");
const path = require("path");

const DEFAULT_PACK_ART = "art/reverse.webp";
const PACK_ART_RE = /^art\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|webp|jpe?g)$/i;

function optionalString(value, label, maxLength, fallback = "") {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") throw new Error(`Invalid ${label}.`);
  return value.trim().slice(0, maxLength);
}

function boundedInteger(value, label, fallback, min, max) {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved < min || resolved > max) {
    throw new Error(`Invalid ${label}.`);
  }
  return resolved;
}

function resolvePackArt(value, publicDir) {
  const packArt = optionalString(value, "pack art", 180, DEFAULT_PACK_ART).replace(/\\/g, "/");
  if (!PACK_ART_RE.test(packArt)) {
    throw new Error("Pack art must be an image inside public/art (for example, art/my-pack.webp).");
  }
  if (publicDir && !fs.existsSync(path.join(publicDir, packArt))) {
    throw new Error(`Pack art does not exist: ${packArt}.`);
  }
  return packArt;
}

function isShopExpansion(meta) {
  return Boolean(meta && meta.enabled !== false && (meta.shop === true || meta.availableInShop === true));
}

function getShopPackSettings(meta, { defaultPrice, defaultSize, maxPrice, maxSize, publicDir } = {}) {
  if (!isShopExpansion(meta)) return null;
  return {
    packName: optionalString(meta.packName, "pack name", 80, `${meta.name || meta.id} Pack`),
    packPriceGold: boundedInteger(meta.packPriceGold, "pack price", defaultPrice, 1, maxPrice),
    packSize: boundedInteger(meta.packSize, "pack size", defaultSize, 1, maxSize),
    // shopPackArt is kept as a friendly alias for older/manual expansion files.
    packArt: resolvePackArt(meta.packArt ?? meta.shopPackArt, publicDir),
  };
}

module.exports = {
  DEFAULT_PACK_ART,
  getShopPackSettings,
  isShopExpansion,
};
