const { assertMongoKeySegment, sanitizeString } = require("./mongoSafety");

const SHOP_ITEMS = [
  {
    id: "achievement:gold-hoarder",
    type: "achievement",
    achievementId: "gold-hoarder",
    name: "Gold Hoarder",
    description: "Unlock a profile achievement for duelists who turn saved gold into status.",
    priceGold: 200,
  },
  {
    id: "title:lord-of-the-cards",
    type: "title",
    titleId: "lord-of-the-cards",
    name: "Lord of the Cards",
    description: "Unlock the Lord of the Cards profile title.",
    priceGold: 30,
  },
];

function getShopItems() {
  return SHOP_ITEMS.map((item) => ({ ...item }));
}

function getShopItem(itemId) {
  const safeItemId = assertMongoKeySegment(itemId, "shop item id");
  return getShopItems().find((item) => item.id === safeItemId) || null;
}

function toPublicShopItem(item) {
  return {
    id: item.id,
    type: item.type,
    achievementId: item.achievementId,
    titleId: item.titleId,
    name: sanitizeString(item.name, { label: "shop item name", max: 80 }),
    description: sanitizeString(item.description, { label: "shop item description", max: 180 }),
    priceGold: item.priceGold,
  };
}

module.exports = {
  getShopItem,
  getShopItems,
  toPublicShopItem,
};
