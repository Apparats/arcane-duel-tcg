const tradeState = {
  loaded: false,
  code: null,
  currentTradeId: null,
  currentTrade: null,
  cardPage: 1,
  pollTimer: null,
  homePollTimer: null,
};

async function tradeRequest(path, options = {}) {
  const res = await arcaneFetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error("Trade server is not ready. Restart the local server and try again.");
  }
  if (!res.ok) throw new Error(data.error || "Trade request failed.");
  return data;
}

function ownTradeCards() {
  return getInventoryCards()
    .filter((card) => getCardQuantity(card) > 0)
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
}

function openTrade() {
  if (!requireLoggedInForPlay()) return;
  switchScreen("trade");
  loadTradeHome();
  startTradeHomePolling();
}

async function loadTradeHome() {
  try {
    const data = await tradeRequest("/trades/me");
    tradeState.loaded = true;
    tradeState.code = data.code;
    $("tradeOwnCode").textContent = data.code;
    renderTradeSessions(data.sessions || []);
    if (!tradeState.currentTradeId && data.sessions?.[0]) {
      setCurrentTrade(data.sessions[0]);
    } else {
      renderTradeCards();
      renderTradeSession();
    }
  } catch (err) {
    showToast(err.message);
  }
}

function renderTradeSessions(sessions) {
  const list = $("tradeSessions");
  list.innerHTML = "";
  if (!sessions.length) {
    list.innerHTML = '<p class="trade-session-empty">No open trades yet.</p>';
    return;
  }
  sessions.forEach((trade) => {
    const other = trade.players.find((player) => !player.isYou);
    const button = document.createElement("button");
    button.className = `trade-session-item${trade.id === tradeState.currentTradeId ? " active" : ""}`;
    button.innerHTML = `<span>${escapeHtml(other?.username || "Player")}</span><small>${escapeHtml(trade.status || "pending")}</small>`;
    button.addEventListener("click", () => setCurrentTrade(trade));
    list.appendChild(button);
  });
}

function setCurrentTrade(trade) {
  tradeState.currentTradeId = trade.id;
  tradeState.currentTrade = trade;
  renderTradeSession();
  renderTradeCards();
  startTradePolling();
}

function renderTradeSession() {
  const trade = tradeState.currentTrade;
  const status = $("tradeSessionStatus");
  $("btnConfirmTrade").disabled = !trade || trade.status !== "pending";
  $("btnCancelTrade").disabled = !trade || trade.status !== "pending";

  if (!trade) {
    $("tradeSessionTitle").textContent = "No trade selected";
    status.textContent = "Waiting";
    status.dataset.state = "waiting";
    $("tradeOfferSummary").innerHTML = '<div class="trade-deal-empty"><span>↔</span><strong>Connect with a player to begin</strong><small>Both offers will appear here before either card is exchanged.</small></div>';
    return;
  }

  const other = trade.players.find((player) => !player.isYou);
  $("tradeSessionTitle").textContent = `Trading with ${other?.username || "Player"}`;
  status.textContent = trade.status;
  status.dataset.state = trade.status;
  $("tradeOfferSummary").innerHTML = trade.players
    .map((player) => {
      const offer = player.offer;
      const card = offer?.id ? TCGCards.getCardById(offer.id) : null;
      const cardHTML = card
        ? `<span class="minion-card inventory-card trade-offer-preview ${rarityClass(card)}">${inventoryCardFaceHTML(card, true)}</span>`
        : '<span class="trade-offer-placeholder" aria-hidden="true"><b>+</b><small>Waiting for a card</small></span>';
      return `
        <div class="trade-offer-card${player.confirmed ? " confirmed" : ""}">
          <div class="trade-offer-owner"><span>${player.isYou ? "Your offer" : escapeHtml(player.username || "Player")}</span><small>${player.confirmed ? "Confirmed" : "Reviewing"}</small></div>
          <div class="trade-offer-visual">${cardHTML}</div>
          <strong>${offer ? escapeHtml(offer.name) : "No card selected"}</strong>
        </div>
      `;
    })
    .join("");
  lazyLoadInventoryArt();
}

function renderTradeCards() {
  const grid = $("tradeCardGrid");
  const pagination = $("tradeCardPagination");
  grid.innerHTML = "";

  const myOfferId = tradeState.currentTrade?.players.find((player) => player.isYou)?.offer?.id;
  const cards = ownTradeCards();
  const cardsPerPage = 5;
  const pageCount = Math.max(1, Math.ceil(cards.length / cardsPerPage));
  tradeState.cardPage = Math.min(Math.max(1, tradeState.cardPage), pageCount);
  const firstCard = (tradeState.cardPage - 1) * cardsPerPage;
  const visibleCards = cards.slice(firstCard, firstCard + cardsPerPage);

  if (!cards.length) {
    grid.innerHTML = '<p class="trade-cards-empty">Your collection has no tradable cards.</p>';
    pagination.innerHTML = "";
  }

  visibleCards.forEach((card) => {
    const selected = card.id === myOfferId;
    const el = document.createElement("button");
    el.className = `trade-card-button trade-card-row${selected ? " selected" : ""}`;
    el.disabled = !tradeState.currentTrade || tradeState.currentTrade.status !== "pending";
    el.setAttribute("aria-label", `Offer ${card.name}`);
    el.innerHTML = `
      <span class="minion-card inventory-card trade-card-preview ${rarityClass(card)}">
        ${inventoryCardFaceHTML(card, true)}
        <span class="inventory-card-count">x${getCardQuantity(card)}</span>
      </span>
      <span class="trade-card-row-info">
        <strong>${escapeHtml(card.name)}</strong>
        <small>${escapeHtml(card.rarity || "common")} · ${escapeHtml(card.type || "card")} · ${card.cost} mana</small>
      </span>
      <span class="trade-card-row-action">${selected ? "Offering" : "Offer"}</span>
    `;
    el.addEventListener("click", () => offerTradeCard(card.id));
    attachCardTooltip(el, card);
    grid.appendChild(el);
  });

  if (cards.length) renderTradeCardPagination(pageCount);

  $("tradeSelectedCard").textContent = myOfferId
    ? `Offering ${TCGCards.getCardById(myOfferId)?.name || "selected card"}`
    : "Choose a card to offer";
  lazyLoadInventoryArt();
}

function renderTradeCardPagination(pageCount) {
  const pagination = $("tradeCardPagination");
  const page = tradeState.cardPage;
  const visiblePages = 5;
  const start = Math.max(1, Math.min(page - Math.floor(visiblePages / 2), pageCount - visiblePages + 1));
  const end = Math.min(pageCount, start + visiblePages - 1);
  const pageButtons = [];
  for (let number = start; number <= end; number += 1) {
    pageButtons.push(`<button type="button" class="trade-page-button${number === page ? " active" : ""}" data-trade-page="${number}" aria-current="${number === page ? "page" : "false"}">${number}</button>`);
  }
  pagination.innerHTML = `
    <button type="button" class="trade-page-button trade-page-step" data-trade-page="${page - 1}" ${page === 1 ? "disabled" : ""} aria-label="Previous page">‹</button>
    ${start > 1 ? '<span class="trade-page-ellipsis">…</span>' : ""}
    ${pageButtons.join("")}
    ${end < pageCount ? '<span class="trade-page-ellipsis">…</span>' : ""}
    <button type="button" class="trade-page-button trade-page-step" data-trade-page="${page + 1}" ${page === pageCount ? "disabled" : ""} aria-label="Next page">›</button>
  `;
  pagination.querySelectorAll("[data-trade-page]").forEach((button) => {
    button.addEventListener("click", () => {
      tradeState.cardPage = Number(button.dataset.tradePage);
      renderTradeCards();
    });
  });
}

async function refreshTradeCode() {
  try {
    const data = await tradeRequest("/trades/refresh-code", { method: "POST", body: "{}" });
    tradeState.code = data.code;
    $("tradeOwnCode").textContent = data.code;
    showToast("Trade code refreshed.");
  } catch (err) {
    showToast(err.message);
  }
}

async function startTradeFromCode() {
  const code = $("tradeJoinCode").value.trim();
  if (!code) return showToast("Enter a trade code.");

  try {
    const data = await tradeRequest("/trades/start", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    $("tradeJoinCode").value = "";
    setCurrentTrade(data.trade);
  } catch (err) {
    showToast(err.message);
  }
}

async function offerTradeCard(cardId) {
  if (!tradeState.currentTradeId) return showToast("Connect to another player first.");
  try {
    const data = await tradeRequest(`/trades/${tradeState.currentTradeId}/offer`, {
      method: "POST",
      body: JSON.stringify({ cardId }),
    });
    setCurrentTrade(data.trade);
  } catch (err) {
    showToast(err.message);
  }
}

function applyTradeCollectionUpdate(collectionUpdate) {
  if (!collectionUpdate || !accountState?.user) return;
  accountState.user.cardCollection = collectionUpdate.cardCollection || {};
  accountState.user.unlockedCards = collectionUpdate.unlockedCards || [];
}

async function confirmTrade() {
  if (!tradeState.currentTradeId) return;
  try {
    const data = await tradeRequest(`/trades/${tradeState.currentTradeId}/confirm`, {
      method: "POST",
      body: "{}",
    });
    applyTradeCollectionUpdate(data.collectionUpdate);
    setCurrentTrade(data.trade);
    if (data.trade.status === "completed") {
      window.ArcaneAudio?.playSfx("tradeConfirm");
      showToast("Trade completed.");
    }
  } catch (err) {
    showToast(err.message);
  }
}

async function cancelTrade() {
  if (!tradeState.currentTradeId) return;
  try {
    const data = await tradeRequest(`/trades/${tradeState.currentTradeId}/cancel`, {
      method: "POST",
      body: "{}",
    });
    setCurrentTrade(data.trade);
  } catch (err) {
    showToast(err.message);
  }
}

async function pollCurrentTrade() {
  if (!tradeState.currentTradeId) return;
  try {
    const data = await tradeRequest(`/trades/${tradeState.currentTradeId}`);
    applyTradeCollectionUpdate(data.collectionUpdate);
    tradeState.currentTrade = data.trade;
    renderTradeSession();
    renderTradeCards();
  } catch (err) {
    stopTradePolling();
  }
}

function startTradePolling() {
  stopTradePolling();
  tradeState.pollTimer = setInterval(pollCurrentTrade, 2500);
}

function stopTradePolling() {
  if (tradeState.pollTimer) {
    clearInterval(tradeState.pollTimer);
    tradeState.pollTimer = null;
  }
}

function startTradeHomePolling() {
  stopTradeHomePolling();
  tradeState.homePollTimer = setInterval(loadTradeHome, 4000);
}

function stopTradeHomePolling() {
  if (tradeState.homePollTimer) {
    clearInterval(tradeState.homePollTimer);
    tradeState.homePollTimer = null;
  }
}

$("tileTrade").addEventListener("click", openTrade);
$("btnTradeBack").addEventListener("click", () => {
  stopTradePolling();
  stopTradeHomePolling();
  switchScreen("menu");
});
$("btnRefreshTradeCode").addEventListener("click", refreshTradeCode);
$("btnStartTrade").addEventListener("click", startTradeFromCode);
$("btnConfirmTrade").addEventListener("click", confirmTrade);
$("btnCancelTrade").addEventListener("click", cancelTrade);
