const cardOpeningQueue = [];
let cardOpeningActive = false;
let cardOpeningRevealTimers = [];
const CARD_REVEAL_INTERVAL_MS = 700;

function clearCardOpeningRevealTimers() {
  cardOpeningRevealTimers.forEach((timer) => clearTimeout(timer));
  cardOpeningRevealTimers = [];
}

function ensureCardOpeningOverlay() {
  let overlay = $("cardOpeningOverlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "cardOpeningOverlay";
  overlay.className = "card-opening-overlay hidden";
  overlay.innerHTML = `
    <div class="card-opening-panel">
      <div class="card-opening-pack" id="cardOpeningPack" aria-hidden="true"><span></span></div>
      <h2 id="cardOpeningTitle">Pack opened</h2>
      <p id="cardOpeningSummary"></p>
      <div id="cardOpeningGrid" class="card-opening-grid"></div>
      <button id="btnCardOpeningDone" class="btn btn-primary">Continue</button>
    </div>
  `;
  document.body.appendChild(overlay);
  $("btnCardOpeningDone").addEventListener("click", closeCardOpening);
  return overlay;
}

function queueCardOpening(opening) {
  cardOpeningQueue.push(opening);
  if (!cardOpeningActive) showNextCardOpening();
}

function showNextCardOpening() {
  const opening = cardOpeningQueue.shift();
  if (!opening) {
    cardOpeningActive = false;
    clearCardOpeningRevealTimers();
    return;
  }

  cardOpeningActive = true;
  clearCardOpeningRevealTimers();
  window.ArcaneAudio?.playSfx("packOpen");
  const overlay = ensureCardOpeningOverlay();
  const grid = $("cardOpeningGrid");
  grid.innerHTML = "";
  $("cardOpeningTitle").textContent = opening.title || "Pack opened";
  $("cardOpeningSummary").textContent = opening.summary || "";

  opening.cards.forEach((card, idx) => {
    const el = document.createElement("div");
    el.className = `minion-card inventory-card card-opening-card ${rarityClass(card)}${card.isNew ? " card-opening-new" : ""}`;
    el.style.setProperty("--reveal-delay", `${idx * CARD_REVEAL_INTERVAL_MS}ms`);
    el.innerHTML = `
      ${cardArtHTML(card)}
      ${cardCostHTML(card)}
      <div class="card-badges">${keywordBadgesHTML(card)}</div>
      <div class="card-footer">
        ${
          card.type === "minion"
            ? `<span class="card-stat atk">${card.attack}</span><span class="card-name">${escapeHtml(card.name)}</span><span class="card-stat hp">${card.health}</span>`
            : `<span class="card-name">${escapeHtml(card.name)}</span>${card.value !== undefined ? `<span class="card-stat val">${card.value}</span>` : ""}`
        }
      </div>
      ${card.isNew ? `<span class="card-opening-badge">New</span>` : ""}
    `;
    el.addEventListener("click", () => openCardZoom(card));
    grid.appendChild(el);
    const revealTimer = setTimeout(() => window.ArcaneAudio?.playSfx("cardReveal"), idx * CARD_REVEAL_INTERVAL_MS);
    cardOpeningRevealTimers.push(revealTimer);
  });

  overlay.classList.remove("hidden");
  requestAnimationFrame(() => overlay.classList.add("revealing"));
}

function closeCardOpening() {
  const overlay = ensureCardOpeningOverlay();
  clearCardOpeningRevealTimers();
  $("cardOpeningGrid").innerHTML = "";
  overlay.classList.add("hidden");
  overlay.classList.remove("revealing");
  showNextCardOpening();
}
