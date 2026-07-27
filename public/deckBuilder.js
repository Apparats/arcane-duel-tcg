let deckBuilderState = {
  loaded: false,
  decks: [],
  activeDeckId: null,
  currentDeckId: null,
  cardIds: [],
};

let deckFiltersReady = false;

function setInventoryTab(tabName) {
  const isDeck = tabName === "deck";
  const isScraping = tabName === "scraping";
  $("collectionPanel").classList.toggle("hidden", isDeck || isScraping);
  $("deckBuilderPanel").classList.toggle("hidden", !isDeck);
  $("scrapingPanel").classList.toggle("hidden", !isScraping);
  $("tabCollection").classList.toggle("active", !isDeck && !isScraping);
  $("tabDeckBuilder").classList.toggle("active", isDeck);
  $("tabScraping").classList.toggle("active", isScraping);
  if (isDeck) openDeckBuilder();
  if (isScraping) openScrapingPanel();
}

async function fetchDeckState() {
  const res = await arcaneFetch("/decks");
  if (!res.ok) throw new Error("Could not load decks.");
  return res.json();
}

function currentDeckCounts() {
  return TCGDeckRules.countCards(deckBuilderState.cardIds);
}

function deckCollectionContext() {
  return {
    cardCollection: accountState?.user?.cardCollection || {},
    unlockedCards: accountState?.user?.unlockedCards || [],
  };
}

function validateCurrentDeck() {
  return TCGDeckRules.validateDeck(deckBuilderState.cardIds, deckCollectionContext());
}

function blockingDeckErrors(validation) {
  return validation.errors.filter((error) => !error.includes(`exactly ${TCGDeckRules.DECK_SIZE} cards`));
}

function renderSavedDeckSelect() {
  const select = $("savedDeckSelect");
  select.innerHTML = "";
  if (!deckBuilderState.currentDeckId) {
    const unsaved = document.createElement("option");
    unsaved.value = "";
    unsaved.textContent = "New unsaved deck";
    select.appendChild(unsaved);
  }
  deckBuilderState.decks.forEach((deck) => {
    const opt = document.createElement("option");
    opt.value = deck.id;
    opt.textContent = `${deck.name}${deck.id === deckBuilderState.activeDeckId ? " (active)" : ""}`;
    select.appendChild(opt);
  });
  select.value = deckBuilderState.currentDeckId || "";
  $("btnDeleteDeck").disabled = !deckBuilderState.currentDeckId || deckBuilderState.decks.length <= 1;
}

function renderActiveDeckSummary() {
  const summary = $("deckActiveSummary");
  const current = deckBuilderState.decks.find((deck) => deck.id === deckBuilderState.currentDeckId);
  const active = deckBuilderState.decks.find((deck) => deck.id === deckBuilderState.activeDeckId);
  const currentName = $("deckNameInput").value.trim() || "New Deck";
  const isActive = Boolean(current && current.id === deckBuilderState.activeDeckId);
  summary.classList.toggle("is-active", isActive);
  summary.classList.toggle("is-new", !current);
  summary.innerHTML = isActive
    ? `<span class="deck-active-mark" aria-hidden="true"></span><span><strong>Active deck</strong><b>${escapeHtml(current.name)}</b><small>Used for your next match</small></span>`
    : `<span class="deck-active-mark" aria-hidden="true"></span><span><strong>Editing</strong><b>${escapeHtml(currentName)}</b><small>Active deck: ${escapeHtml(active?.name || "None")}</small></span>`;
}

function loadDeck(deckId) {
  const deck = deckBuilderState.decks.find((item) => item.id === deckId);
  if (!deck) return;
  deckBuilderState.currentDeckId = deck.id;
  deckBuilderState.cardIds = deck.cardIds.slice();
  $("deckNameInput").value = deck.name;
  renderDeckBuilder();
}

function newDeck() {
  deckBuilderState.currentDeckId = null;
  deckBuilderState.cardIds = [];
  $("deckNameInput").value = "New Deck";
  renderDeckBuilder();
}

function applyDeckState(state) {
  deckBuilderState.decks = state.decks || [];
  deckBuilderState.activeDeckId = state.activeDeckId || null;
}

async function selectSavedDeck(deckId) {
  if (!deckId) return;
  const selected = deckBuilderState.decks.find((deck) => deck.id === deckId);
  if (!selected) return;

  try {
    const res = await arcaneFetch(`/decks/${encodeURIComponent(deckId)}/activate`, { method: "POST" });
    const state = await res.json();
    if (!res.ok) throw new Error(state.error || "Could not select deck.");
    applyDeckState(state);
    loadDeck(deckId);
  } catch (err) {
    showToast(err.message);
    renderDeckBuilder();
  }
}

function ownedCards() {
  return getInventoryCards()
    .filter((card) => getCardQuantity(card) > 0);
}

function populateDeckFilters() {
  if (deckFiltersReady) return;

  const cards = getInventoryCards();
  const countries = [...new Set(cards.map((card) => card.country).filter(Boolean))].sort();
  fillSelect($("deckFilterCountry"), countries);
  const expansionSelect = $("deckFilterExpansion");
  const expansionIds = [...new Set(cards.map(getCardExpansionId).filter(Boolean))].sort();
  expansionIds.forEach((expansionId) => {
    const option = document.createElement("option");
    option.value = expansionId;
    option.textContent = expansionId === "TheGates" ? "The Gates" : expansionId;
    expansionSelect.appendChild(option);
  });
  deckFiltersReady = true;
}

function currentDeckFilters() {
  return {
    name: $("deckFilterName").value,
    rarity: $("deckFilterRarity").value,
    country: $("deckFilterCountry").value,
    keyword: $("deckFilterKeyword").value,
    expansion: $("deckFilterExpansion").value,
  };
}

function addDeckCard(cardId) {
  if (deckBuilderState.cardIds.length >= TCGDeckRules.DECK_SIZE) {
    showToast(`Deck already has ${TCGDeckRules.DECK_SIZE} cards.`);
    return;
  }

  deckBuilderState.cardIds.push(cardId);
  const validation = validateCurrentDeck();
  const blockingErrors = blockingDeckErrors(validation);
  if (blockingErrors.length > 0) {
    deckBuilderState.cardIds.pop();
    showToast(blockingErrors[0]);
  }
  renderDeckBuilder();
}

function removeDeckCard(cardId) {
  const idx = deckBuilderState.cardIds.indexOf(cardId);
  if (idx !== -1) deckBuilderState.cardIds.splice(idx, 1);
  renderDeckBuilder();
}

function renderDeckPool() {
  const counts = currentDeckCounts();
  const spellLimitReached = TCGDeckRules.countSpellCards(deckBuilderState.cardIds) >= TCGDeckRules.MAX_SPELLS;
  const pool = $("deckCardPool");
  const cards = sortCardsForDisplay(
    ownedCards().filter((card) => cardMatchesFilters(card, currentDeckFilters())),
    $("deckFilterSort").value
  );
  pool.innerHTML = "";
  $("deckPoolEmpty").classList.toggle("hidden", cards.length > 0);

  cards.forEach((card) => {
    const owned = getCardQuantity(card);
    const used = counts[card.id] || 0;
    const full = used >= owned || deckBuilderState.cardIds.length >= TCGDeckRules.DECK_SIZE || (card.type === "spell" && spellLimitReached);
    const el = document.createElement("button");
    el.className = `deck-pool-card card-tilt-shell${full ? " deck-pool-card-disabled" : ""}`;
    el.disabled = full;
    el.innerHTML = `
      <span class="minion-card inventory-card deck-card-preview ${rarityClass(card)}">
        ${inventoryCardFaceHTML(card, true)}
        <span class="inventory-card-count">x${owned}</span>
        <span class="deck-card-used">${used}/${owned}</span>
      </span>
    `;
    el.addEventListener("click", () => addDeckCard(card.id));
    attachCardTooltip(el, card);
    pool.appendChild(el);
  });

  lazyLoadInventoryArt();
}

function renderDeckList() {
  const counts = currentDeckCounts();
  const list = $("deckList");
  list.innerHTML = "";
  if (deckBuilderState.cardIds.length === 0) {
    const empty = document.createElement("div");
    empty.className = "deck-list-empty";
    empty.textContent = "No cards in this deck yet.";
    list.appendChild(empty);
    return;
  }

  Object.entries(counts)
    .map(([cardId, count]) => ({ card: TCGCards.getCardById(cardId), count }))
    .filter((item) => item.card)
    .sort((a, b) => a.card.cost - b.card.cost || a.card.name.localeCompare(b.card.name))
    .forEach(({ card, count }) => {
      const keywords = (card.keywords || []).filter((keyword) => ["charge", "taunt", "divineShield"].includes(keyword));
      const keywordMarkup = keywords.map((keyword) => {
        const label = keyword === "divineShield" ? "Divine Shield" : keyword[0].toUpperCase() + keyword.slice(1);
        return `<span class="deck-row-keyword kw-${keyword}" title="${label}" aria-label="${label}">${keywordIconHTML(keyword)}</span>`;
      }).join("");
      const row = document.createElement("button");
      row.className = `deck-row ${rarityClass(card)}`;
      row.type = "button";
      row.title = "Remove one copy";
      row.innerHTML = `
        <span class="deck-row-mana">
          <span class="deck-row-cost">${card.cost}</span>
          ${keywordMarkup ? `<span class="deck-row-keywords">${keywordMarkup}</span>` : ""}
        </span>
        <span class="deck-row-name">${escapeHtml(card.name)}</span>
        <span class="deck-row-count">x${count}</span>
        <span class="deck-row-remove" aria-hidden="true">-</span>
      `;
      row.addEventListener("click", () => removeDeckCard(card.id));
      list.appendChild(row);
    });
}

function renderDeckStatus() {
  $("deckCount").textContent = `${deckBuilderState.cardIds.length} / ${TCGDeckRules.DECK_SIZE}`;
  const validation = validateCurrentDeck();
  const blockingErrors = blockingDeckErrors(validation);
  const cardsNeeded = TCGDeckRules.DECK_SIZE - deckBuilderState.cardIds.length;
  $("deckStatus").textContent = validation.ok
    ? "Deck is valid."
    : blockingErrors[0] || (cardsNeeded > 0 ? `Add ${cardsNeeded} more card${cardsNeeded === 1 ? "" : "s"}.` : "");
  $("deckStatus").classList.toggle("valid", validation.ok);
  $("btnSaveDeck").disabled = !validation.ok;
}

function renderDeckLimits() {
  const counts = currentDeckCounts();
  const rarityTotals = {};
  let spellTotal = 0;
  Object.keys(counts).forEach((cardId) => {
    const card = TCGCards.getCardById(cardId);
    if (!card) return;
    const rarity = card.rarity || "common";
    rarityTotals[rarity] = (rarityTotals[rarity] || 0) + counts[cardId];
    if (card.type === "spell") spellTotal += counts[cardId];
  });

  const limits = [
    { label: "Spells", value: spellTotal, max: TCGDeckRules.MAX_SPELLS, className: "spell" },
    { label: "Legendary", value: rarityTotals.legendary || 0, max: TCGDeckRules.RARITY_TOTAL_LIMITS.legendary, className: "legendary" },
    { label: "Mythic", value: rarityTotals.mythic || 0, max: TCGDeckRules.RARITY_TOTAL_LIMITS.mythic, className: "mythic" },
  ];
  $("deckLimitsSummary").innerHTML = limits.map(({ label, value, max, className }) => {
    const full = value >= max;
    return `<div class="deck-limit-item ${className}${full ? " is-full" : ""}"><span>${label}</span><b>${value}<small> / ${max}</small></b></div>`;
  }).join("");
}

function renderDeckBuilder() {
  renderSavedDeckSelect();
  renderActiveDeckSummary();
  renderDeckPool();
  renderDeckList();
  renderDeckLimits();
  renderDeckStatus();
}

async function openDeckBuilder() {
  if (!requireLoggedInForPlay()) return;
  populateDeckFilters();
  if (!deckBuilderState.loaded) {
    try {
      const state = await fetchDeckState();
      deckBuilderState.loaded = true;
      applyDeckState(state);
      if (deckBuilderState.decks.length > 0) {
        loadDeck(state.activeDeckId || deckBuilderState.decks[0].id);
      }
    } catch (err) {
      showToast(err.message);
    }
  }
  renderDeckBuilder();
}

async function saveCurrentDeck() {
  const validation = validateCurrentDeck();
  if (!validation.ok) return showToast(validation.errors[0]);

  const saveButton = $("btnSaveDeck");
  saveButton.disabled = true;
  saveButton.dataset.label = saveButton.textContent;
  saveButton.textContent = "Saving...";
  try {
    const res = await arcaneFetch("/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: deckBuilderState.currentDeckId,
        name: $("deckNameInput").value.trim() || "My Deck",
        cardIds: deckBuilderState.cardIds,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not save deck.");
    applyDeckState(data.state);
    deckBuilderState.currentDeckId = data.deck.id;
    showToast("Deck saved.");
    renderDeckBuilder();
  } catch (err) {
    showToast(err.message);
  } finally {
    saveButton.textContent = saveButton.dataset.label || "Save deck";
    delete saveButton.dataset.label;
    renderDeckBuilder();
  }
}

async function autoBuildCurrentDeck() {
  const autoButton = $("btnAutoDeck");
  autoButton.disabled = true;
  autoButton.dataset.label = autoButton.textContent;
  autoButton.textContent = "Building...";
  try {
    const res = await arcaneFetch("/decks/auto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: deckBuilderState.currentDeckId,
        name: $("deckNameInput").value.trim() || "Auto Deck",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not auto build deck.");
    applyDeckState(data.state);
    deckBuilderState.currentDeckId = data.deck.id;
    deckBuilderState.cardIds = data.deck.cardIds.slice();
    $("deckNameInput").value = data.deck.name;
    showToast("Deck auto built.");
    renderDeckBuilder();
  } catch (err) {
    showToast(err.message);
  } finally {
    autoButton.textContent = autoButton.dataset.label || "Auto build";
    delete autoButton.dataset.label;
    renderDeckBuilder();
  }
}

$("tabCollection").addEventListener("click", () => setInventoryTab("collection"));
$("tabDeckBuilder").addEventListener("click", () => setInventoryTab("deck"));
$("tabScraping").addEventListener("click", () => setInventoryTab("scraping"));
$("savedDeckSelect").addEventListener("change", (event) => selectSavedDeck(event.target.value));
$("btnNewDeck").addEventListener("click", newDeck);
$("btnAutoDeck").addEventListener("click", autoBuildCurrentDeck);
$("btnSaveDeck").addEventListener("click", saveCurrentDeck);

function closeDeleteDeckModal() {
  $("deleteDeckModal").classList.add("hidden");
}

function openDeleteDeckModal() {
  const deck = deckBuilderState.decks.find((item) => item.id === deckBuilderState.currentDeckId);
  if (!deck || deckBuilderState.decks.length <= 1) return showToast("You must keep at least one deck.");
  $("deleteDeckWarning").textContent = `Delete ${deck.name}? This cannot be undone.`;
  $("deleteDeckModal").classList.remove("hidden");
}

async function deleteCurrentDeck() {
  const deckId = deckBuilderState.currentDeckId;
  if (!deckId || deckBuilderState.decks.length <= 1) return;

  const confirmButton = $("btnConfirmDeleteDeck");
  confirmButton.disabled = true;
  try {
    const res = await arcaneFetch(`/decks/${encodeURIComponent(deckId)}`, { method: "DELETE" });
    const state = await res.json();
    if (!res.ok) throw new Error(state.error || "Could not delete deck.");
    applyDeckState(state);
    loadDeck(deckBuilderState.activeDeckId || deckBuilderState.decks[0]?.id);
    closeDeleteDeckModal();
    showToast("Deck deleted.");
  } catch (err) {
    showToast(err.message);
  } finally {
    confirmButton.disabled = false;
  }
}

$("btnDeleteDeck").addEventListener("click", openDeleteDeckModal);
$("btnCancelDeleteDeck").addEventListener("click", closeDeleteDeckModal);
$("btnConfirmDeleteDeck").addEventListener("click", deleteCurrentDeck);
$("deleteDeckModal").addEventListener("click", (event) => {
  if (event.target.id === "deleteDeckModal") closeDeleteDeckModal();
});

["deckFilterRarity", "deckFilterCountry", "deckFilterKeyword", "deckFilterExpansion", "deckFilterSort"].forEach((id) => {
  $(id).addEventListener("change", renderDeckPool);
});

$("deckFilterName").addEventListener("input", renderDeckPool);

$("btnClearDeckFilters").addEventListener("click", () => {
  $("deckFilterName").value = "";
  $("deckFilterRarity").value = "all";
  $("deckFilterCountry").value = "all";
  $("deckFilterKeyword").value = "all";
  $("deckFilterExpansion").value = "all";
  $("deckFilterSort").value = "cost-asc";
  renderDeckPool();
});
