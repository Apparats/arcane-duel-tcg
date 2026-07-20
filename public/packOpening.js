const cardOpeningQueue = [];
let cardOpeningActive = false;
let cardOpeningRevealTimers = [];
let cardOpeningUnrevealed = 0;
let cardOpeningCurrent = null;
const DEFAULT_CARD_BACK_ART = "art/reverse.webp";

function clearCardOpeningRevealTimers() {
  cardOpeningRevealTimers.forEach((timer) => clearTimeout(timer));
  cardOpeningRevealTimers = [];
}

function cardOpeningBackArt(opening) {
  const art = String(opening?.packArt || opening?.art || DEFAULT_CARD_BACK_ART).replace(/\\/g, "/");
  return art.startsWith("art/") ? art : DEFAULT_CARD_BACK_ART;
}

function cardOpeningFaceHTML(card) {
  return `
    ${cardArtHTML(card)}
    ${cardCostHTML(card)}
    <div class="card-badges">${keywordBadgesHTML(card)}</div>
    <div class="card-footer">
      ${
        card.type === "minion"
          ? `<span class="card-stat atk">${card.attack}</span><span class="card-name">${escapeHtml(card.name)}</span><span class="card-stat hp">${card.health}</span>`
          : `<span class="card-name">${escapeHtml(card.name)}</span>${spellEffectValueHTML(card)}`
      }
    </div>
    ${card.isNew ? `<span class="card-opening-badge">New</span>` : ""}
  `;
}

function setCardOpeningDoneEnabled(enabled) {
  const button = $("btnCardOpeningDone");
  button.disabled = false;
  button.textContent = enabled ? "Continue" : "Reveal all";
}

function ensureCardOpeningOverlay() {
  let overlay = $("cardOpeningOverlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "cardOpeningOverlay";
  overlay.className = "card-opening-overlay hidden";
  overlay.innerHTML = `
    <div class="card-opening-panel" role="dialog" aria-modal="true" aria-labelledby="cardOpeningTitle">
      <div class="card-opening-hero">
        <div class="card-opening-pack" id="cardOpeningPack" aria-hidden="true">
          <img id="cardOpeningPackImage" src="${DEFAULT_CARD_BACK_ART}" alt="" />
        </div>
        <div class="card-opening-copy">
          <span class="card-opening-kicker">Pack reveal</span>
          <h2 id="cardOpeningTitle">Pack opened</h2>
          <p id="cardOpeningSummary"></p>
        </div>
      </div>
      <p id="cardOpeningPrompt" class="card-opening-prompt">Tap each card to flip it.</p>
      <div id="cardOpeningGrid" class="card-opening-grid"></div>
      <button id="btnCardOpeningDone" class="btn btn-primary">Reveal all</button>
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

function revealOpeningCard(button, card) {
  const alreadyRevealed = button.classList.contains("is-revealed");
  if (alreadyRevealed && card) {
    openCardZoom(card);
    return;
  }
  if (alreadyRevealed) return;

  button.classList.remove("is-face-down");
  button.classList.add("is-revealed");
  if (card) button.setAttribute("aria-label", `Open ${card.name} details`);
  cardOpeningUnrevealed = Math.max(0, cardOpeningUnrevealed - 1);
  window.ArcaneAudio?.playSfx("cardReveal");

  if (cardOpeningUnrevealed === 0) {
    $("cardOpeningPrompt").textContent = "All cards revealed. Tap a card to inspect it.";
    setCardOpeningDoneEnabled(true);
  } else {
    $("cardOpeningPrompt").textContent = `${cardOpeningUnrevealed} card${cardOpeningUnrevealed === 1 ? "" : "s"} left to reveal.`;
  }
}

function revealAllOpeningCards() {
  document.querySelectorAll(".card-opening-slot:not(.is-revealed)").forEach((button) => {
    button.classList.remove("is-face-down");
    button.classList.add("is-revealed");
    const cardName = button.dataset.cardName || "card";
    button.setAttribute("aria-label", `Open ${cardName} details`);
  });
  if (cardOpeningUnrevealed > 0) window.ArcaneAudio?.playSfx("cardReveal");
  cardOpeningUnrevealed = 0;
  $("cardOpeningPrompt").textContent = "All cards revealed. Tap a card to inspect it.";
  setCardOpeningDoneEnabled(true);
}

function showNextCardOpening() {
  const opening = cardOpeningQueue.shift();
  if (!opening) {
    cardOpeningActive = false;
    cardOpeningUnrevealed = 0;
    cardOpeningCurrent = null;
    clearCardOpeningRevealTimers();
    return;
  }

  cardOpeningActive = true;
  cardOpeningCurrent = opening;
  clearCardOpeningRevealTimers();
  window.ArcaneAudio?.playSfx("packOpen");
  const overlay = ensureCardOpeningOverlay();
  const grid = $("cardOpeningGrid");
  const packArt = cardOpeningBackArt(opening);
  const cards = opening.cards || [];
  cardOpeningUnrevealed = cards.length;
  grid.innerHTML = "";
  $("cardOpeningPackImage").src = packArt;
  $("cardOpeningTitle").textContent = opening.title || "Pack opened";
  $("cardOpeningSummary").textContent = opening.summary || "";
  $("cardOpeningPrompt").textContent = cards.length > 0
    ? "Tap each card to flip it."
    : "No cards to reveal.";
  setCardOpeningDoneEnabled(cards.length === 0);

  cards.forEach((card, idx) => {
    const button = document.createElement("button");
    const rarity = card.rarity || "common";
    button.className = `card-opening-slot is-face-down card-opening-rarity-${rarity}${card.isNew ? " card-opening-new" : ""}`;
    button.type = "button";
    button.style.setProperty("--deal-delay", `${Math.min(idx, 8) * 70}ms`);
    button.dataset.cardName = card.name || "card";
    button.setAttribute("aria-label", `Reveal card ${idx + 1}`);
    button.innerHTML = `
      <div class="card-opening-card-inner">
        <div class="card-opening-face card-opening-back card-opening-back-${rarity}">
          <img src="${escapeHtmlAttr(packArt)}" alt="" />
          <span>Reveal</span>
        </div>
        <div class="card-opening-face card-opening-front minion-card inventory-card ${rarityClass(card)}">
          ${cardOpeningFaceHTML(card)}
        </div>
      </div>
    `;
    button.addEventListener("click", () => revealOpeningCard(button, card));
    grid.appendChild(button);
  });

  overlay.classList.remove("hidden");
  requestAnimationFrame(() => overlay.classList.add("revealing"));
}

function closeCardOpening() {
  if (cardOpeningUnrevealed > 0) {
    revealAllOpeningCards();
    return;
  }
  const overlay = ensureCardOpeningOverlay();
  clearCardOpeningRevealTimers();
  $("cardOpeningGrid").innerHTML = "";
  overlay.classList.add("hidden");
  overlay.classList.remove("revealing");
  cardOpeningUnrevealed = 0;
  const completedOpening = cardOpeningCurrent;
  cardOpeningCurrent = null;
  if (typeof completedOpening?.onComplete === "function") {
    try {
      completedOpening.onComplete(completedOpening);
    } catch (error) {
      console.error("Card opening completion failed:", error);
    }
  }
  showNextCardOpening();
}
