const tradeState = {
  loaded: false,
  code: null,
  currentTradeId: null,
  currentTrade: null,
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
  sessions.forEach((trade) => {
    const other = trade.players.find((player) => !player.isYou);
    const button = document.createElement("button");
    button.className = `trade-session-item${trade.id === tradeState.currentTradeId ? " active" : ""}`;
    button.textContent = `${other?.username || "Player"} - ${trade.status}`;
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
  $("btnConfirmTrade").disabled = !trade || trade.status !== "pending";
  $("btnCancelTrade").disabled = !trade || trade.status !== "pending";

  if (!trade) {
    $("tradeSessionTitle").textContent = "No trade selected";
    $("tradeSessionStatus").textContent = "Waiting";
    $("tradeOfferSummary").innerHTML = "";
    return;
  }

  const other = trade.players.find((player) => !player.isYou);
  $("tradeSessionTitle").textContent = `Trading with ${other?.username || "Player"}`;
  $("tradeSessionStatus").textContent = trade.status;
  $("tradeOfferSummary").innerHTML = trade.players
    .map((player) => {
      const offer = player.offer;
      return `
        <div class="trade-offer-card${player.confirmed ? " confirmed" : ""}">
          <span>${player.isYou ? "You" : escapeHtml(player.username || "Player")}</span>
          <strong>${offer ? escapeHtml(offer.name) : "No card offered"}</strong>
          <small>${player.confirmed ? "Confirmed" : "Not confirmed"}</small>
        </div>
      `;
    })
    .join("");
}

function renderTradeCards() {
  const grid = $("tradeCardGrid");
  grid.innerHTML = "";

  const myOfferId = tradeState.currentTrade?.players.find((player) => player.isYou)?.offer?.id;
  ownTradeCards().forEach((card) => {
    const selected = card.id === myOfferId;
    const el = document.createElement("button");
    el.className = `trade-card-button${selected ? " selected" : ""}`;
    el.disabled = !tradeState.currentTrade || tradeState.currentTrade.status !== "pending";
    el.innerHTML = `
      <span class="minion-card inventory-card trade-card-preview ${rarityClass(card)}">
        ${inventoryCardFaceHTML(card, true)}
        <span class="inventory-card-count">x${getCardQuantity(card)}</span>
      </span>
    `;
    el.addEventListener("click", () => offerTradeCard(card.id));
    attachCardTooltip(el, card);
    grid.appendChild(el);
  });

  $("tradeSelectedCard").textContent = myOfferId
    ? `Offering ${TCGCards.getCardById(myOfferId)?.name || "selected card"}`
    : "Choose a card to offer";
  lazyLoadInventoryArt();
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
