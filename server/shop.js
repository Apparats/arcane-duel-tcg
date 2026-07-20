const express = require("express");
const { buyPack, buyShopItem } = require("./db");
const { getSessionUser } = require("./auth");
const { getShopPack, getShopPacks, toPublicPack } = require("./shopCatalog");
const { getShopItem, getShopItems, toPublicShopItem } = require("./shopItems");
const { assertMongoKeySegment } = require("./mongoSafety");

const router = express.Router();

router.get("/config", (req, res) => {
  res.json({
    packs: getShopPacks().map(toPublicPack),
    items: getShopItems().map(toPublicShopItem),
  });
});

router.post("/buy-pack", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });

  try {
    const packId = assertMongoKeySegment(req.body?.packId, "pack id");
    const pack = getShopPack(packId);
    if (!pack) return res.status(404).json({ error: "Pack not available." });

    const result = await buyPack(user.id, pack);
    res.json({ ok: true, pack: result });
  } catch (err) {
    if (["INVALID_INPUT", "INVALID_ID"].includes(err.code)) {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === "NOT_ENOUGH_GOLD") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Pack purchase failed:", err);
    res.status(500).json({ error: "Could not buy pack." });
  }
});

router.post("/buy-item", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });

  try {
    const itemId = assertMongoKeySegment(req.body?.itemId, "shop item id");
    const item = getShopItem(itemId);
    if (!item) return res.status(404).json({ error: "Shop item not available." });

    const result = await buyShopItem(user.id, item);
    res.json({ ok: true, purchase: result });
  } catch (err) {
    if (["INVALID_INPUT", "INVALID_ID"].includes(err.code)) {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === "NOT_ENOUGH_GOLD" || err.code === "SHOP_ITEM_OWNED") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Shop item purchase failed:", err);
    res.status(500).json({ error: "Could not buy item." });
  }
});

module.exports = { router };
