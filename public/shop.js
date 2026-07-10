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
      <div class="shop-pack-art" aria-hidden="true"><span></span></div>
      <div class="shop-pack-body">
        <h2>${escapeHtml(pack.name)}</h2>
        <p>${escapeHtml(pack.description || `Cards from ${pack.expansionName}.`)}</p>
        <div class="shop-pack-meta">
          <span>${pack.priceGold} gold</span>
          <span>${pack.size} cards</span>
          <span>${pack.cardCount} in set</span>
          <span>${packCollectionProgress(pack)}</span>
        </div>
        <button class="btn btn-primary btn-buy-pack" data-pack-id="${escapeHtmlAttr(pack.id)}">Open pack</button>
      </div>
    `;
    list.appendChild(el);
  });
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
  const button =
    event.target && event.target.nodeType === Node.ELEMENT_NODE
      ? event.target.closest(".btn-buy-pack")
      : null;
  if (!button) return;
  buyPack(button.dataset.packId);
});
