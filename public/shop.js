let shopConfig = null;
let shopBusy = false;

const SHOP_RARITY_ORDER = ["common", "rare", "legendary", "mythic", "souvenir"];
const SHOP_RARITY_LABEL = {
  common: "Common",
  rare: "Rare",
  legendary: "Legendary",
  mythic: "Mythic",
  souvenir: "Souvenir",
};

function currentGold() {
  return accountState?.user?.gold || 0;
}

function shopFormatNumber(value) {
  return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("en-US");
}

function updateShopGold() {
  $("shopGold").textContent = `${shopFormatNumber(currentGold())} gold`;
}

function cardsForShopPack(pack) {
  const includedIds = new Set(pack.cardIds || []);
  return (window.TCGCards?.CARDS || []).filter((card) => includedIds.has(card.id));
}

function shopOwnedCount(card) {
  const collection = accountState?.user?.cardCollection || {};
  const unlockedCards = new Set(accountState?.user?.unlockedCards || []);
  if (Object.prototype.hasOwnProperty.call(collection, card.id)) return collection[card.id] || 0;
  return unlockedCards.has(card.id) ? 1 : 0;
}

function packCollectionStats(pack) {
  const cards = cardsForShopPack(pack);
  const total = Number(pack.cardCount || cards.length || 0);
  const ownedCards = cards.filter((card) => shopOwnedCount(card) > 0);
  const copies = cards.reduce((sum, card) => sum + shopOwnedCount(card), 0);
  const owned = ownedCards.length;
  const missing = Math.max(0, total - owned);
  const completion = total > 0 ? owned / total : 0;
  return { cards, total, owned, missing, copies, completion };
}

function packRarityCounts(pack) {
  return cardsForShopPack(pack).reduce((counts, card) => {
    const rarity = card.rarity || "common";
    counts[rarity] = (counts[rarity] || 0) + 1;
    return counts;
  }, {});
}

function packDropChances(pack) {
  const counts = packRarityCounts(pack);
  const weights = pack.rarityWeights || {};
  const entries = SHOP_RARITY_ORDER
    .filter((rarity) => counts[rarity] > 0 && Number(weights[rarity]) > 0)
    .map((rarity) => ({ rarity, weight: Number(weights[rarity]) }));
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) return [];
  return entries.map((entry) => ({
    rarity: entry.rarity,
    percent: (entry.weight / totalWeight) * 100,
    count: counts[entry.rarity] || 0,
  }));
}

function formatPackChance(percent) {
  const rounded = percent < 1 ? percent.toFixed(1) : String(Math.round(percent));
  return `${rounded.replace(/\.0$/, "")}%`;
}

function packExpectedNewChance(pack) {
  const stats = packCollectionStats(pack);
  if (stats.total <= 0) return 0;
  return Math.round((stats.missing / stats.total) * 100);
}

function bestShopPack(packs) {
  const affordable = packs.filter((pack) => currentGold() >= Number(pack.priceGold || 0));
  const candidates = affordable.length > 0 ? affordable : packs;
  return candidates
    .map((pack) => {
      const stats = packCollectionStats(pack);
      const price = Math.max(1, Number(pack.priceGold || 1));
      return { pack, score: (stats.missing * Math.max(1, Number(pack.size || 1))) / price };
    })
    .sort((left, right) => right.score - left.score || left.pack.priceGold - right.pack.priceGold)[0]?.pack || null;
}

function renderShopDashboard(packs) {
  const dashboard = $("shopDashboard");
  if (!dashboard) return;

  const totals = packs.reduce((summary, pack) => {
    const stats = packCollectionStats(pack);
    summary.owned += stats.owned;
    summary.total += stats.total;
    return summary;
  }, { owned: 0, total: 0 });
  const completion = totals.total > 0 ? Math.round((totals.owned / totals.total) * 100) : 0;

  dashboard.innerHTML = `
    <div class="shop-dashboard-item">
      <span>Collection</span>
      <strong>${completion}%</strong>
      <small>${totals.owned} / ${totals.total} cards</small>
    </div>
  `;
}

async function loadShopConfig() {
  if (shopConfig) return shopConfig;
  const res = await arcaneFetch("/shop/config");
  shopConfig = await res.json();
  renderShopPacks(shopConfig.packs || []);
  renderShopItems(shopConfig.items || []);
  return shopConfig;
}

function shopItemOwned(item) {
  const user = accountState?.user || {};
  if (item.type === "achievement") {
    const progress = window.ArcaneProfileCatalog?.getProgress(user.stats, user.selectedTitle?.id || user.selectedTitle, user.equippedBadgeIds, {
      supporter: user.supporter === true,
      cardCollection: user.cardCollection,
      unlockedCards: user.unlockedCards,
      purchasedAchievementIds: user.purchasedAchievementIds,
      purchasedTitleIds: user.purchasedTitleIds,
      quickplayRank: user.quickplayRank,
      bestQuickplayRank: user.quickplayBestRank ?? user.stats?.bestQuickplayRank,
    });
    return Boolean(progress?.achievements?.find((achievement) => achievement.id === item.achievementId)?.unlocked);
  }
  if (item.type === "title") {
    const progress = window.ArcaneProfileCatalog?.getProgress(user.stats, user.selectedTitle?.id || user.selectedTitle, user.equippedBadgeIds, {
      supporter: user.supporter === true,
      cardCollection: user.cardCollection,
      unlockedCards: user.unlockedCards,
      purchasedAchievementIds: user.purchasedAchievementIds,
      purchasedTitleIds: user.purchasedTitleIds,
      quickplayRank: user.quickplayRank,
      bestQuickplayRank: user.quickplayBestRank ?? user.stats?.bestQuickplayRank,
    });
    return Boolean(progress?.titles?.find((title) => title.id === item.titleId)?.unlocked);
  }
  return false;
}

function renderShopItems(items) {
  const list = $("shopItemList");
  if (!list) return;
  list.innerHTML = "";

  if (!items.length) return;

  items.forEach((item) => {
    const owned = shopItemOwned(item);
    const canAfford = currentGold() >= Number(item.priceGold || 0);
    const neededGold = Math.max(0, Number(item.priceGold || 0) - currentGold());
    const el = document.createElement("article");
    el.className = `shop-store-item shop-store-item-${escapeHtmlAttr(item.type || "item")}${owned ? " is-owned" : canAfford ? " can-afford" : " is-locked"}`;
    el.innerHTML = `
      <div class="shop-store-icon" aria-hidden="true">${item.type === "title" ? "T" : "A"}</div>
      <div class="shop-store-body">
        <span class="shop-pack-kicker">${escapeHtml(item.type === "title" ? "Title" : "Achievement")}</span>
        <h2>${escapeHtml(item.name)}</h2>
        <p>${escapeHtml(item.description || "")}</p>
      </div>
      <div class="shop-store-action">
        <strong>${shopFormatNumber(item.priceGold)}g</strong>
        <button class="btn btn-primary btn-buy-shop-item" data-item-id="${escapeHtmlAttr(item.id)}"${owned || !canAfford ? " disabled" : ""}>
          ${owned ? "Owned" : canAfford ? "Buy" : `Need ${shopFormatNumber(neededGold)}g`}
        </button>
      </div>
    `;
    list.appendChild(el);
  });
}

function packMetaHTML(pack, stats) {
  return `
    <div class="shop-pack-metrics">
      <div><span>Price</span><strong>${shopFormatNumber(pack.priceGold)}g</strong></div>
      <div><span>QTY</span><strong>${pack.size}</strong></div>
      <div><span>Set</span><strong>${stats.total}</strong></div>
    </div>
  `;
}

function packOddsHTML(pack) {
  const chances = packDropChances(pack);
  if (chances.length === 0) return "";
  return `
    <div class="shop-pack-odds" aria-label="Pack rarity odds">
      ${chances.map((entry) => `
        <span class="shop-odds-chip shop-rarity-${entry.rarity}">
          <b>${SHOP_RARITY_LABEL[entry.rarity] || entry.rarity}</b>
          ${formatPackChance(entry.percent)}
        </span>
      `).join("")}
    </div>
  `;
}

function renderShopPacks(packs) {
  const list = $("shopPackList");
  list.innerHTML = "";
  updateShopGold();
  renderShopDashboard(packs);

  if (packs.length === 0) {
    list.innerHTML = `<p class="shop-empty">No expansions are available in the shop.</p>`;
    return;
  }

  const recommended = bestShopPack(packs);
  packs.forEach((pack) => {
    const stats = packCollectionStats(pack);
    const canAfford = currentGold() >= Number(pack.priceGold || 0);
    const isRecommended = recommended?.id === pack.id;
    const completionPercent = Math.round(stats.completion * 100);
    const neededGold = Math.max(0, Number(pack.priceGold || 0) - currentGold());
    const el = document.createElement("article");
    el.className = `shop-pack${canAfford ? " can-afford" : " is-locked"}${isRecommended ? " is-recommended" : ""}`;
    el.innerHTML = `
      <div class="shop-pack-art" aria-hidden="true">
        <img class="shop-pack-art-image" src="${escapeHtmlAttr(pack.art || "art/reverse.webp")}" alt="" />
        <span class="shop-pack-completion">${completionPercent}%</span>
      </div>
      <div class="shop-pack-body">
        <div class="shop-pack-title-row">
          <div>
            <span class="shop-pack-kicker">${escapeHtml(pack.expansionName || "Expansion")}</span>
            <h2>${escapeHtml(pack.name)}</h2>
          </div>
          ${isRecommended ? `<span class="shop-pack-tag">Best value</span>` : ""}
        </div>
        <p>${escapeHtml(pack.description || `Cards from ${pack.expansionName}.`)}</p>
        <div class="shop-progress" aria-label="${escapeHtmlAttr(`${stats.owned} of ${stats.total} cards collected`)}">
          <span style="width: ${completionPercent}%"></span>
        </div>
        <div class="shop-pack-progress-copy">${stats.owned} / ${stats.total} collected · ${stats.copies} total copies</div>
        ${packMetaHTML(pack, stats)}
        ${packOddsHTML(pack)}
        <div class="shop-pack-actions">
          <button class="shop-pack-info btn-view-expansion" data-pack-id="${escapeHtmlAttr(pack.id)}" type="button" aria-label="View collectible cards in ${escapeHtmlAttr(pack.name)}" title="View collectible cards">?</button>
          <button class="btn btn-primary btn-buy-pack" data-pack-id="${escapeHtmlAttr(pack.id)}"${canAfford ? "" : " disabled"}>
            ${canAfford ? "Open pack" : `Need ${shopFormatNumber(neededGold)}g`}
          </button>
        </div>
      </div>
    `;
    list.appendChild(el);
  });

  const upcoming = document.createElement("p");
  upcoming.className = "shop-upcoming-expansions";
  upcoming.textContent = "More expansions soon";
  list.appendChild(upcoming);
}

function openExpansionContents(pack) {
  const grid = $("expansionContentsGrid");
  const cards = cardsForShopPack(pack);
  const rewardGold = Number(pack.rewardGold || 0);
  const stats = packCollectionStats(pack);
  $("expansionContentsTitle").textContent = pack.expansionName || pack.name;
  grid.innerHTML = "";

  if (cards.length === 0 && rewardGold > 0) {
    $("expansionContentsSummary").textContent = pack.goldRewardClaimed
      ? `The ${rewardGold} gold campaign reward has already been claimed.`
      : `${rewardGold} gold for victory. This reward can be claimed once per account.`;
    grid.innerHTML = `
      <div class="campaign-gold-reward${pack.goldRewardClaimed ? " is-claimed" : ""}">
        <span class="campaign-gold-reward-value">${rewardGold}</span>
        <span class="campaign-gold-reward-label">gold</span>
        <span class="campaign-gold-reward-status">${pack.goldRewardClaimed ? "Claimed" : "One-time victory reward"}</span>
      </div>`;
    $("expansionContentsOverlay").classList.remove("hidden");
    return;
  }

  $("expansionContentsSummary").textContent = `${stats.owned} / ${stats.total} collected · ${pack.size} cards per pack.`;

  const rewardUnit = pack.cardDrops ? "victory" : "pack";
  const rewardNotes = [`${stats.owned} / ${stats.total} collected`, `${pack.size} cards per ${rewardUnit}`];
  if (rewardGold > 0) {
    rewardNotes.push(pack.goldRewardClaimed ? `${rewardGold} gold claimed` : `${rewardGold} one-time gold`);
  }
  $("expansionContentsSummary").textContent = rewardNotes.join(" · ");

  cards.forEach((card) => {
    const shell = document.createElement("div");
    shell.className = "card-tilt-shell shop-expansion-card-shell";
    const el = document.createElement("div");
    const isCampaignProgress = Boolean(pack.cardDrops);
    const drawn = Number(pack.cardDrops?.[card.id] || 0);
    const owned = isCardUnlocked(card);
    el.className = `minion-card inventory-card shop-expansion-card ${rarityClass(card)}${isCampaignProgress ? "" : owned ? "" : " inventory-card-locked"}`;
    el.innerHTML = isCampaignProgress
      ? `${inventoryCardFaceHTML(card, true)}<span class="inventory-card-count">${drawn > 0 ? `Drawn x${drawn}` : "Not drawn"}</span>`
      : owned
        ? `${inventoryCardFaceHTML(card, true)}<span class="inventory-card-count">x${getCardQuantity(card)}</span>`
        : lockedInventoryCardHTML(card);
    el.addEventListener("click", () => isCampaignProgress || owned ? openCardZoom(card) : showToast("Unlock this card from packs."));
    shell.appendChild(el);
    grid.appendChild(shell);
  });

  $("expansionContentsOverlay").classList.remove("hidden");
  lazyLoadInventoryArt();
}

function closeExpansionContents() {
  $("expansionContentsOverlay").classList.add("hidden");
}

async function openShop() {
  if (!requireLoggedInForPlay()) return;
  updateShopGold();
  switchScreen("shop");
  try {
    await loadShopConfig();
    renderShopPacks(shopConfig.packs || []);
    renderShopItems(shopConfig.items || []);
  } catch (err) {
    showToast("Could not load the shop.");
  }
}

function renderPackResultStats(pack, newCount) {
  const stats = $("packResultStats");
  if (!stats) return;
  const rarityCounts = pack.cards.reduce((counts, card) => {
    const rarity = card.rarity || "common";
    counts[rarity] = (counts[rarity] || 0) + 1;
    return counts;
  }, {});
  const duplicateCount = pack.cards.length - newCount;
  stats.innerHTML = `
    <span>${newCount} new</span>
    <span>${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"}</span>
    ${SHOP_RARITY_ORDER.filter((rarity) => rarityCounts[rarity] > 0).map((rarity) =>
      `<span class="shop-rarity-${rarity}">${SHOP_RARITY_LABEL[rarity]} x${rarityCounts[rarity]}</span>`
    ).join("")}
  `;
}

function renderPackResults(pack) {
  const grid = $("packResultGrid");
  grid.innerHTML = "";

  pack.cards.forEach((card) => {
    const shell = document.createElement("div");
    shell.className = "card-tilt-shell";
    const el = document.createElement("div");
    el.className = `minion-card inventory-card shop-result-card ${rarityClass(card)}${card.isNew ? " shop-result-new" : ""}`;
    el.innerHTML = `
      ${inventoryCardFaceHTML(card)}
      ${card.isNew ? `<span class="shop-result-badge">New</span>` : `<span class="shop-result-badge shop-result-duplicate">x${card.quantityAfter || 1}</span>`}
    `;
    el.addEventListener("click", () => openCardZoom(card));
    shell.appendChild(el);
    grid.appendChild(shell);
  });

  const newCount = pack.cards.filter((card) => card.isNew).length;
  $("packResultSummary").textContent = packResultSummaryText(pack);
  renderPackResultStats(pack, newCount);
}

function packResultSummaryText(pack) {
  const newCount = (pack.cards || []).filter((card) => card.isNew).length;
  return `${newCount} new card${newCount === 1 ? "" : "s"} unlocked.`;
}

async function buyPack(packId) {
  if (shopBusy || !requireLoggedInForPlay()) return;
  const requestedPack = (shopConfig?.packs || []).find((pack) => pack.id === packId);
  if (requestedPack && currentGold() < Number(requestedPack.priceGold || 0)) {
    showToast(`Not enough gold. You need ${shopFormatNumber(Number(requestedPack.priceGold || 0) - currentGold())} more.`);
    return;
  }

  shopBusy = true;
  document.querySelectorAll(".btn-buy-pack").forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.packId === packId) btn.textContent = "Opening...";
  });

  try {
    const res = await arcaneFetch("/shop/buy-pack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not buy pack.");

    const userUpdate = {
      ...(accountState?.user || {}),
      gold: data.pack.gold,
      unlockedCards: data.pack.unlockedCards,
      cardCollection: data.pack.cardCollection,
      stats: data.pack.stats,
    };
    updateAccountDisplay(userUpdate);
    updateShopGold();
    renderShopPacks(shopConfig?.packs || []);
    queueCardOpening({
      title: "Pack opened",
      summary: packResultSummaryText(data.pack),
      packArt: requestedPack?.art,
      cards: data.pack.cards,
      onComplete: () => renderPackResults(data.pack),
    });
    if (typeof renderInventoryGrid === "function") renderInventoryGrid();
  } catch (err) {
    showToast(err.message);
  } finally {
    shopBusy = false;
    renderShopPacks(shopConfig?.packs || []);
    renderShopItems(shopConfig?.items || []);
  }
}

async function buyShopItem(itemId) {
  if (shopBusy || !requireLoggedInForPlay()) return;
  const requestedItem = (shopConfig?.items || []).find((item) => item.id === itemId);
  if (requestedItem && shopItemOwned(requestedItem)) {
    showToast("You already own this item.");
    return;
  }
  if (requestedItem && currentGold() < Number(requestedItem.priceGold || 0)) {
    showToast(`Not enough gold. You need ${shopFormatNumber(Number(requestedItem.priceGold || 0) - currentGold())} more.`);
    return;
  }

  shopBusy = true;
  document.querySelectorAll(".btn-buy-shop-item, .btn-buy-pack").forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.itemId === itemId) btn.textContent = "Buying...";
  });

  try {
    const res = await arcaneFetch("/shop/buy-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not buy item.");

    updateAccountDisplay({
      ...(accountState?.user || {}),
      ...(data.purchase?.user || {}),
    });
    updateShopGold();
    renderShopPacks(shopConfig?.packs || []);
    renderShopItems(shopConfig?.items || []);
    showToast(`${data.purchase?.item?.name || "Item"} unlocked.`);
  } catch (err) {
    showToast(err.message);
  } finally {
    shopBusy = false;
    renderShopPacks(shopConfig?.packs || []);
    renderShopItems(shopConfig?.items || []);
  }
}

$("tileShop").addEventListener("click", openShop);
$("btnShopBack").addEventListener("click", () => switchScreen("menu"));
$("shopPackList").addEventListener("click", (event) => {
  const target =
    event.target && event.target.nodeType === Node.ELEMENT_NODE
      ? event.target
      : null;
  if (!target) return;
  const buyButton = target.closest(".btn-buy-pack");
  if (buyButton) return buyPack(buyButton.dataset.packId);

  const viewButton = target.closest(".btn-view-expansion");
  if (!viewButton) return;
  const pack = (shopConfig?.packs || []).find((entry) => entry.id === viewButton.dataset.packId);
  if (pack) openExpansionContents(pack);
});

$("shopItemList")?.addEventListener("click", (event) => {
  const target =
    event.target && event.target.nodeType === Node.ELEMENT_NODE
      ? event.target
      : null;
  if (!target) return;
  const buyButton = target.closest(".btn-buy-shop-item");
  if (buyButton) return buyShopItem(buyButton.dataset.itemId);
});

$("btnCloseExpansionContents").addEventListener("click", closeExpansionContents);
$("expansionContentsOverlay").addEventListener("click", (event) => {
  if (event.target.id === "expansionContentsOverlay") closeExpansionContents();
});
