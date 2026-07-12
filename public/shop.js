let shopConfig = null;
let shopBusy = false;

function currentGold() {
  return accountState?.user?.gold || 0;
}

function updateShopGold() {
  $("shopGold").textContent = `${currentGold()} gold`;
}

function packCollectionProgress(pack) {
  const collection = accountState?.user?.cardCollection || {};
  const unlockedCards = new Set(accountState?.user?.unlockedCards || []);
  const expansionPrefix = `${pack.expansionId}:`;
  const expansionCards = (window.TCGCards?.CARDS || []).filter((card) => card.id?.startsWith(expansionPrefix));
  const owned = expansionCards.filter((card) => unlockedCards.has(card.id) || (collection[card.id] || 0) > 0).length;
  return `${owned} / ${pack.cardCount} collected`;
}

async function loadShopConfig() {
  if (shopConfig) return shopConfig;
  const res = await arcaneFetch("/shop/config");
  shopConfig = await res.json();
  renderShopPacks(shopConfig.packs || []);
  return shopConfig;
}

function renderShopPacks(packs) {
  const list = $("shopPackList");
  list.innerHTML = "";

  if (packs.length === 0) {
    list.innerHTML = `<p class="shop-empty">No expansions are available in the shop.</p>`;
    return;
  }

  packs.forEach((pack) => {
    const el = document.createElement("div");
    el.className = "shop-pack";
    el.innerHTML = `
      <div class="shop-pack-art" aria-hidden="true"><img class="shop-pack-art-image" src="${escapeHtmlAttr(pack.art || "art/reverse.webp")}" alt="" /></div>
      <div class="shop-pack-body">
        <h2>${escapeHtml(pack.name)}</h2>
        <p>${escapeHtml(pack.description || `Cards from ${pack.expansionName}.`)}</p>
        <div class="shop-pack-meta">
          <span>${pack.priceGold} gold</span>
          <span>${pack.size} cards</span>
          <span>${pack.cardCount} in set</span>
          <span>${packCollectionProgress(pack)}</span>
        </div>
        <div class="shop-pack-actions">
          <button class="shop-pack-info btn-view-expansion" data-pack-id="${escapeHtmlAttr(pack.id)}" type="button" aria-label="View collectible cards in ${escapeHtmlAttr(pack.name)}" title="View collectible cards">?</button>
          <button class="btn btn-primary btn-buy-pack" data-pack-id="${escapeHtmlAttr(pack.id)}">Open pack</button>
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

function cardsForShopPack(pack) {
  const includedIds = new Set(pack.cardIds || []);
  return (window.TCGCards?.CARDS || []).filter((card) => includedIds.has(card.id));
}

function openExpansionContents(pack) {
  const grid = $("expansionContentsGrid");
  const cards = cardsForShopPack(pack);
  $("expansionContentsTitle").textContent = pack.expansionName || pack.name;
  $("expansionContentsSummary").textContent = `${cards.length} collectible card${cards.length === 1 ? "" : "s"} in this expansion.`;
  grid.innerHTML = "";

  cards.forEach((card) => {
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
    grid.appendChild(el);
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
  } catch (err) {
    showToast("Could not load the shop.");
  }
}

function renderPackResults(pack) {
  const grid = $("packResultGrid");
  grid.innerHTML = "";

  pack.cards.forEach((card) => {
    const el = document.createElement("div");
    el.className = `minion-card inventory-card shop-result-card ${rarityClass(card)}${card.isNew ? " shop-result-new" : ""}`;
    el.innerHTML = `
      ${inventoryCardFaceHTML(card)}
      ${card.isNew ? `<span class="shop-result-badge">New</span>` : ""}
    `;
    el.addEventListener("click", () => openCardZoom(card));
    grid.appendChild(el);
  });

  const newCount = pack.cards.filter((card) => card.isNew).length;
  $("packResultSummary").textContent = `${newCount} new card${newCount === 1 ? "" : "s"} unlocked.`;
}

async function buyPack(packId) {
  if (shopBusy || !requireLoggedInForPlay()) return;
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
    renderPackResults(data.pack);
    queueCardOpening({
      title: "Pack opened",
      summary: $("packResultSummary").textContent,
      cards: data.pack.cards,
    });
    if (typeof renderInventoryGrid === "function") renderInventoryGrid();
  } catch (err) {
    showToast(err.message);
  } finally {
    shopBusy = false;
    document.querySelectorAll(".btn-buy-pack").forEach((btn) => {
      btn.disabled = false;
      btn.textContent = "Open pack";
    });
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

$("btnCloseExpansionContents").addEventListener("click", closeExpansionContents);
$("expansionContentsOverlay").addEventListener("click", (event) => {
  if (event.target.id === "expansionContentsOverlay") closeExpansionContents();
});
