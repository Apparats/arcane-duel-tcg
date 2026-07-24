// ============================================================
// INVENTORY — browse every card in the game, filter by type,
// rarity, country, and race, and click one to see it zoomed in
// with full details. Purely client-side: reads directly from
// window.TCGCards (the compiled card list), no match or server
// involved. Reuses the card-rendering helpers already defined in
// client.js ($, cardArtHTML, keywordBadgesHTML, rarityClass,
// activeKeywords, escapeHtml, KEYWORD_LABEL, KEYWORD_FULL_LABEL,
// RARITY_LABEL, switchScreen) so cards look identical everywhere.
// ============================================================

// ---- Unlock system (not built yet) ----
// Everything is unlocked for now, for debugging. When real card
// unlocks are added later, this is the only function that needs
// to change — the grid and zoom view already call it.
function isCardUnlocked(card) {
  return getCardQuantity(card) > 0;
}

function getCardQuantity(card) {
  const collection = accountState?.user?.cardCollection || {};
  const unlocked = accountState?.user?.unlockedCards || [];
  if (Object.prototype.hasOwnProperty.call(collection, card.id)) return collection[card.id] || 0;
  return unlocked.includes(card.id) ? 1 : 0;
}

// ---- Card list + filters ----

let inventoryAllCards = [];
let inventoryFiltersReady = false;
let scrapingBusy = false;
let scrapingDecks = [];
let scrapingSelections = {};
let scrapingFiltersReady = false;
let scrapingPage = 1;
let pendingScrapeItems = [];

const SCRAPING_PAGE_SIZE = 10;
const SCRAPE_ANIMATION_VISUAL_LIMIT = 20;
const SCRAPE_ANIMATION_SOUND_LIMIT = 34;

const SCRAP_GOLD_VALUES = {
  common: 1,
  rare: 1,
  legendary: 2,
  mythic: 3,
  souvenir: 10,
};

function getInventoryCards() {
  if (inventoryAllCards.length === 0 && typeof TCGCards !== "undefined") {
    inventoryAllCards = TCGCards.CARDS.filter(isCardFromEnabledExpansion);
  }
  return inventoryAllCards;
}

function getCardExpansionId(card) {
  return card._expansionId || String(card.id || "").split(":")[0];
}

function isCardFromEnabledExpansion(card) {
  if (card.showInInventory === false) return false;
  if (!enabledExpansionIds) return true;
  return enabledExpansionIds.has(getCardExpansionId(card));
}

function fillSelect(selectEl, values) {
  values.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  });
}

function normalizeKeywordSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_:-]+/g, " ")
    .toLowerCase()
    .trim();
}

function cardKeywordSearchText(card) {
  const keywords = Array.isArray(card.keywords) ? card.keywords : [];
  const abilities = Array.isArray(card.abilities) ? card.abilities : [];
  const terms = [
    card.id,
    card.name,
    card.type,
    card.type === "spell" ? "spell magic" : "minion creature",
    card.rarity,
    RARITY_LABEL?.[card.rarity],
    card.country,
    card.race,
    getCardExpansionId(card),
    card.lore,
    `${card.cost} mana`,
    `cost ${card.cost}`,
  ];

  if (card.type === "minion") {
    terms.push(`${card.attack} attack`, `atk ${card.attack}`, `${card.health} health`, `hp ${card.health}`);
  }

  if (keywords.length === 0) terms.push("normal no keyword");
  keywords.forEach((keyword) => {
    terms.push(keyword, KEYWORD_FULL_LABEL?.[keyword]);
  });

  abilities.forEach((ability) => {
    terms.push(
      ability.trigger,
      ability.effect,
      ability.status,
      ability.target,
      ability.race,
      ability.cardId,
      ability.firstDeathOnly ? "first death only" : "",
      ability.firstPlayOnly ? "first play only" : ""
    );
  });

  return normalizeKeywordSearchText(terms.filter(Boolean).join(" "));
}

function cardMatchesKeywordSearch(card, rawQuery) {
  const query = normalizeKeywordSearchText(rawQuery);
  if (!query) return true;
  const haystack = cardKeywordSearchText(card);
  return query
    .split(/[,/;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .some((part) => part.split(/\s+/).every((word) => haystack.includes(word)));
}

async function populateInventoryFilters() {
  if (inventoryFiltersReady) return;
  const cards = getInventoryCards();
  const countries = [...new Set(cards.map((c) => c.country).filter(Boolean))].sort();
  fillSelect($("filterCountry"), countries);
  const expansionSelect = $("filterExpansion");
  const expansionIds = [...new Set(cards.map(getCardExpansionId).filter(Boolean))].sort();
  expansionIds.forEach((expansionId) => {
    const option = document.createElement("option");
    option.value = expansionId;
    option.textContent = expansionId === "TheGates" ? "The Gates" : expansionId;
    expansionSelect.appendChild(option);
  });
  inventoryFiltersReady = true;
}

function currentInventoryFilters() {
  return {
    name: $("filterName").value,
    rarity: $("filterRarity").value,
    country: $("filterCountry").value,
    keyword: $("filterKeyword").value,
    expansion: $("filterExpansion").value,
  };
}

function cardMatchesFilters(card, filters) {
  // This matcher is shared by Collection and Deck Builder. A missing
  // expansion remains compatible with older callers and means "All".
  const expansion = filters.expansion ?? "all";
  const name = String(filters.name || "").trim().toLowerCase();
  if (name && !cardMatchesKeywordSearch(card, name)) return false;
  if (filters.type && filters.type !== "all" && card.type !== filters.type) return false;
  if (filters.rarity !== "all" && card.rarity !== filters.rarity) return false;
  if (filters.country !== "all" && card.country !== filters.country) return false;
  if (expansion !== "all" && getCardExpansionId(card) !== expansion) return false;
  const keywords = Array.isArray(card.keywords) ? card.keywords : [];
  if (filters.keyword === "normal" && (keywords.includes("taunt") || keywords.includes("charge") || keywords.includes("divineShield"))) return false;
  if (filters.keyword !== "all" && filters.keyword !== "normal" && !keywords.includes(filters.keyword)) return false;
  return true;
}

function cardStatValue(card, stat) {
  const value = Number(card?.[stat]);
  return Number.isFinite(value) ? value : null;
}

// Collection and Deck Builder share this so their stat ordering stays identical.
function sortCardsForDisplay(cards, sortBy = "default") {
  if (sortBy === "default") return cards.slice();

  const [stat, direction] = sortBy.split("-");
  const multiplier = direction === "desc" ? -1 : 1;
  return cards.slice().sort((left, right) => {
    const leftValue = cardStatValue(left, stat);
    const rightValue = cardStatValue(right, stat);
    if (leftValue === null && rightValue !== null) return 1;
    if (rightValue === null && leftValue !== null) return -1;
    const difference = (leftValue - rightValue) * multiplier;
    if (difference !== 0) return difference;
    return left.name.localeCompare(right.name) || String(left.id).localeCompare(String(right.id));
  });
}

function inventoryCollectionStats(cards) {
  return cards.reduce((stats, card) => {
    const quantity = getCardQuantity(card);
    if (quantity > 0) {
      stats.owned += 1;
      stats.copies += quantity;
    } else {
      stats.missing += 1;
    }
    if (quantity > 0 && card.rarity === "mythic") stats.mythics += 1;
    return stats;
  }, { owned: 0, missing: 0, copies: 0, mythics: 0 });
}

function renderInventorySummary(cards, filtered) {
  const summary = $("inventorySummary");
  if (!summary) return;
  const stats = inventoryCollectionStats(cards);
  const completion = cards.length > 0 ? Math.round((stats.owned / cards.length) * 100) : 0;
  summary.innerHTML = `
    <div class="inventory-summary-card">
      <span>Completion</span>
      <strong>${completion}%</strong>
      <small>${stats.owned} / ${cards.length} cards</small>
    </div>
    <div class="inventory-summary-card">
      <span>Total copies</span>
      <strong>${stats.copies}</strong>
      <small>available for decks and trades</small>
    </div>
    <div class="inventory-summary-card">
      <span>Mythics</span>
      <strong>${stats.mythics}</strong>
      <small>owned in collection</small>
    </div>
    <div class="inventory-summary-card">
      <span>Filtered</span>
      <strong>${filtered.length}</strong>
      <small>matching current filters</small>
    </div>
  `;
}

async function openInventory() {
  if (!requireLoggedInForPlay()) return;
  await populateInventoryFilters();
  renderInventoryGrid();
  switchScreen("inventory");
}

function inventoryCardFaceHTML(card, lazy = false) {
  return `
    ${cardArtHTML(card, lazy)}
    ${cardCostHTML(card)}
    ${specialAbilityBadgeHTML(card)}
    <div class="card-badges">${keywordBadgesHTML(card)}</div>
    <div class="card-footer">
      ${
        card.type === "minion"
          ? `<span class="card-stat atk">${card.attack}</span><span class="card-name">${escapeHtml(card.name)}</span><span class="card-stat hp">${card.health}</span>`
          : `<span class="card-name">${escapeHtml(card.name)}</span>${spellEffectValueHTML(card)}`
      }
    </div>
  `;
}

function lockedInventoryCardHTML(card) {
  return `
    ${cardCostHTML(card)}
    <div class="inventory-card-locked-face">
      <span class="inventory-card-lock-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M7 10V8a5 5 0 0 1 10 0v2" />
          <rect x="5" y="10" width="14" height="10" rx="2" />
        </svg>
      </span>
      <span class="inventory-card-locked-label">${escapeHtml(card.name)}</span>
    </div>
  `;
}

function renderInventoryGrid() {
  hideCardTooltip(); // avoid a stale tooltip surviving the grid rebuild below

  const cards = getInventoryCards();
  const filters = currentInventoryFilters();
  const filtered = sortCardsForDisplay(cards.filter((c) => cardMatchesFilters(c, filters)), $("filterSort").value);

  const unlockedCount = cards.filter(isCardUnlocked).length;
  $("inventoryCount").textContent = `${unlockedCount} / ${cards.length} unlocked`;
  renderInventorySummary(cards, filtered);
  $("inventoryEmpty").classList.toggle("hidden", filtered.length > 0);

  const grid = $("inventoryGrid");
  grid.innerHTML = "";

  filtered.forEach((card) => {
    const shell = document.createElement("div");
    shell.className = "card-tilt-shell";
    const el = document.createElement("div");
    const unlocked = isCardUnlocked(card);
    el.className = `minion-card inventory-card ${rarityClass(card)}${unlocked ? "" : " inventory-card-locked"}`;
    el.innerHTML = unlocked ? `${inventoryCardFaceHTML(card, true)}<span class="inventory-card-count">x${getCardQuantity(card)}</span>` : lockedInventoryCardHTML(card);
    el.addEventListener("click", () => {
      if (!unlocked) return showToast("Unlock this card from packs.");
      openCardZoom(card);
    });
    if (unlocked) attachCardTooltip(el, card);
    shell.appendChild(el);
    grid.appendChild(shell);
  });

  lazyLoadInventoryArt();
}

function scrapeGoldValue(card) {
  const rarity = String(card?.rarity || "common").trim().toLowerCase();
  return SCRAP_GOLD_VALUES[rarity] || 0;
}

function maxSavedDeckUsage(cardId) {
  return scrapingDecks.reduce((max, deck) => {
    const used = (deck.cardIds || []).filter((id) => id === cardId).length;
    return Math.max(max, used);
  }, 0);
}

function maxScrapeCopies(card) {
  const owned = getCardQuantity(card);
  if (owned <= 1 || scrapeGoldValue(card) <= 0) return 0;
  return Math.max(0, owned - Math.max(1, maxSavedDeckUsage(card.id)));
}

function maxScrapeAllCopies(card) {
  const owned = getCardQuantity(card);
  if (owned <= 2 || scrapeGoldValue(card) <= 0) return 0;
  return Math.max(0, owned - Math.max(2, maxSavedDeckUsage(card.id)));
}

function duplicateScrapeCards() {
  const filters = currentScrapingFilters();
  const cards = getInventoryCards()
    .filter((card) => maxScrapeCopies(card) > 0 && cardMatchesFilters(card, filters));
  return sortScrapeCards(cards, $("scrapingFilterSort")?.value || "value-desc");
}

function populateScrapingFilters() {
  if (scrapingFiltersReady) return;
  const cards = getInventoryCards();
  const countries = [...new Set(cards.map((card) => card.country).filter(Boolean))].sort();
  fillSelect($("scrapingFilterCountry"), countries);
  const expansionSelect = $("scrapingFilterExpansion");
  const expansionIds = [...new Set(cards.map(getCardExpansionId).filter(Boolean))].sort();
  expansionIds.forEach((expansionId) => {
    const option = document.createElement("option");
    option.value = expansionId;
    option.textContent = expansionId === "TheGates" ? "The Gates" : expansionId;
    expansionSelect.appendChild(option);
  });
  scrapingFiltersReady = true;
}

function currentScrapingFilters() {
  return {
    name: $("scrapingFilterName")?.value || "",
    rarity: $("scrapingFilterRarity")?.value || "all",
    country: $("scrapingFilterCountry")?.value || "all",
    keyword: $("scrapingFilterKeyword")?.value || "all",
    expansion: $("scrapingFilterExpansion")?.value || "all",
  };
}

function sortScrapeCards(cards, sortBy) {
  return cards.slice().sort((left, right) => {
    if (sortBy === "name-asc") {
      return left.name.localeCompare(right.name) || String(left.id).localeCompare(String(right.id));
    }
    if (sortBy === "copies-desc") {
      return maxScrapeCopies(right) - maxScrapeCopies(left) || left.name.localeCompare(right.name);
    }
    if (sortBy === "cost-asc" || sortBy === "cost-desc") {
      const multiplier = sortBy === "cost-desc" ? -1 : 1;
      const difference = ((cardStatValue(left, "cost") || 0) - (cardStatValue(right, "cost") || 0)) * multiplier;
      return difference || left.name.localeCompare(right.name) || String(left.id).localeCompare(String(right.id));
    }
    const valueDiff = scrapeGoldValue(right) - scrapeGoldValue(left);
    return valueDiff || maxScrapeCopies(right) - maxScrapeCopies(left) || left.name.localeCompare(right.name) || String(left.id).localeCompare(String(right.id));
  });
}

async function loadScrapingDeckUsage() {
  if (!requireLoggedInForPlay()) return;
  try {
    const res = await arcaneFetch("/decks");
    const state = await res.json();
    if (!res.ok) throw new Error(state.error || "Could not load decks.");
    scrapingDecks = state.decks || [];
  } catch (err) {
    scrapingDecks = [];
    showToast(err.message || "Could not load deck usage.");
  }
}

function selectedScrapeItems() {
  return Object.entries(scrapingSelections)
    .map(([cardId, quantity]) => ({ cardId, quantity: Math.max(0, Math.floor(Number(quantity) || 0)) }))
    .filter((item) => item.quantity > 0);
}

function allFilteredScrapeItems() {
  return duplicateScrapeCards()
    .map((card) => ({ cardId: card.id, quantity: maxScrapeAllCopies(card) }))
    .filter((item) => item.quantity > 0);
}

function scrapeItemTotals(items) {
  return items.reduce(
    (totals, item) => {
      const card = TCGCards.getCardById(item.cardId);
      const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
      totals.totalCards += quantity;
      totals.totalGold += quantity * scrapeGoldValue(card);
      return totals;
    },
    { totalCards: 0, totalGold: 0 }
  );
}

function renderScrapingSummary() {
  const items = selectedScrapeItems();
  const allItems = allFilteredScrapeItems();
  const totalCards = items.reduce((sum, item) => sum + item.quantity, 0);
  $("scrapingSelectedCount").textContent = `${totalCards} card${totalCards === 1 ? "" : "s"}`;
  $("btnScrapeCards").disabled = scrapingBusy || totalCards <= 0;
  $("btnScrapeAllCards").disabled = scrapingBusy || allItems.length === 0;
}

function setScrapeSelection(cardId, quantity) {
  const card = TCGCards.getCardById(cardId);
  if (!card) return;
  const max = maxScrapeCopies(card);
  const next = Math.max(0, Math.min(max, Math.floor(Number(quantity) || 0)));
  if (next > 0) scrapingSelections[cardId] = next;
  else delete scrapingSelections[cardId];
  renderScrapingPanel();
}

function renderScrapingPanel() {
  const list = $("scrapingList");
  if (!list) return;
  const cards = duplicateScrapeCards();
  Object.keys(scrapingSelections).forEach((cardId) => {
    const card = TCGCards.getCardById(cardId);
    if (!card || scrapingSelections[cardId] > maxScrapeCopies(card)) {
      delete scrapingSelections[cardId];
    }
  });

  const totalPages = Math.max(1, Math.ceil(cards.length / SCRAPING_PAGE_SIZE));
  scrapingPage = Math.max(1, Math.min(scrapingPage, totalPages));
  const pageStart = (scrapingPage - 1) * SCRAPING_PAGE_SIZE;
  const visibleCards = cards.slice(pageStart, pageStart + SCRAPING_PAGE_SIZE);

  $("scrapingAvailableCount").textContent = `${cards.length} available`;
  $("scrapingEmpty").classList.toggle("hidden", cards.length > 0);
  $("scrapingPagination").classList.toggle("hidden", cards.length <= SCRAPING_PAGE_SIZE);
  $("scrapingPageStatus").textContent = `Page ${scrapingPage} / ${totalPages}`;
  $("btnScrapingPrev").disabled = scrapingPage <= 1;
  $("btnScrapingNext").disabled = scrapingPage >= totalPages;
  list.innerHTML = "";

  visibleCards.forEach((card) => {
    const owned = getCardQuantity(card);
    const max = maxScrapeCopies(card);
    const selected = scrapingSelections[card.id] || 0;
    const row = document.createElement("article");
    row.className = `scraping-row ${rarityClass(card)}${selected > 0 ? " is-selected" : ""}`;
    row.innerHTML = `
      <button class="scraping-preview card-tilt-shell" type="button" aria-label="View ${escapeHtmlAttr(card.name)}">
        <span class="minion-card inventory-card scraping-card-preview ${rarityClass(card)}">
          ${inventoryCardFaceHTML(card, true)}
          <span class="inventory-card-count">x${owned}</span>
        </span>
      </button>
      <div class="scraping-card-body">
        <span class="scraping-card-name">${escapeHtml(card.name)}</span>
        <span class="scraping-card-meta">${RARITY_LABEL[card.rarity] || "Common"} · ${scrapeGoldValue(card)}g each · ${max} spare</span>
      </div>
      <div class="scraping-qty-control">
        <button class="scraping-step" type="button" data-scrape-step="-1" data-card-id="${escapeHtmlAttr(card.id)}" aria-label="Remove one ${escapeHtmlAttr(card.name)}">-</button>
        <input class="scraping-qty-input" type="number" inputmode="numeric" min="0" max="${max}" value="${selected}" data-card-id="${escapeHtmlAttr(card.id)}" aria-label="${escapeHtmlAttr(card.name)} scrape quantity" />
        <button class="scraping-step" type="button" data-scrape-step="1" data-card-id="${escapeHtmlAttr(card.id)}" aria-label="Add one ${escapeHtmlAttr(card.name)}">+</button>
      </div>
    `;
    row.querySelector(".scraping-preview").addEventListener("click", () => openCardZoom(card));
    attachCardTooltip(row.querySelector(".scraping-preview"), card);
    list.appendChild(row);
  });

  renderScrapingSummary();
  lazyLoadInventoryArt();
}

async function openScrapingPanel() {
  if (!requireLoggedInForPlay()) return;
  populateScrapingFilters();
  await loadScrapingDeckUsage();
  renderScrapingPanel();
}

function scrapeDelay(ms) {
  return typeof sleep === "function" ? sleep(ms) : new Promise((resolve) => setTimeout(resolve, ms));
}

function scrapeItemsForPayload(items) {
  return items
    .map((item) => ({ cardId: item.cardId, quantity: Math.max(0, Math.floor(Number(item.quantity) || 0)) }))
    .filter((item) => item.quantity > 0);
}

function renderScrapeConfirmStack(items) {
  const stack = $("scrapeConfirmStack");
  if (!stack) return;
  stack.innerHTML = "";
  const visualCards = [];
  let hiddenCopies = 0;
  const totals = scrapeItemTotals(items);
  items.forEach((item) => {
    const card = TCGCards.getCardById(item.cardId);
    const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (!card || quantity <= 0) return;
    if (visualCards.length < SCRAPE_ANIMATION_VISUAL_LIMIT) {
      visualCards.push({ card, quantity });
    } else {
      hiddenCopies += quantity;
    }
  });

  visualCards.forEach(({ card, quantity }, index) => {
    const cardEl = document.createElement("span");
    const layer = index - (visualCards.length - 1) / 2;
    cardEl.className = `minion-card inventory-card scraping-animate-card ${rarityClass(card)}`;
    cardEl.style.setProperty("--scrape-x", `${Math.max(-24, Math.min(24, layer * 2.2))}px`);
    cardEl.style.setProperty("--scrape-y", `${Math.max(-18, Math.min(18, layer * -1.4))}px`);
    cardEl.style.setProperty("--scrape-rot", `${((index % 9) - 4) * 1.8}deg`);
    cardEl.style.setProperty("--scrape-z", index + 1);
    cardEl.innerHTML = `
      ${inventoryCardFaceHTML(card, false)}
      ${quantity > 1 ? `<span class="scraping-animate-qty">x${quantity}</span>` : ""}
    `;
    stack.appendChild(cardEl);
  });

  if (hiddenCopies > 0) {
    const overflow = document.createElement("span");
    overflow.className = "scrape-card-stack-overflow";
    overflow.textContent = `+${hiddenCopies}`;
    stack.appendChild(overflow);
  }
}

function openScrapeConfirmModal(items) {
  if (scrapingBusy || !items.length || !requireLoggedInForPlay()) return;
  pendingScrapeItems = scrapeItemsForPayload(items);
  if (!pendingScrapeItems.length) return;
  const totals = scrapeItemTotals(pendingScrapeItems);
  $("scrapeConfirmCount").textContent = `${totals.totalCards} card${totals.totalCards === 1 ? "" : "s"}`;
  $("scrapeConfirmGold").textContent = `${totals.totalGold} gold`;
  $("btnConfirmScrape").disabled = false;
  $("btnCancelScrape").disabled = false;
  renderScrapeConfirmStack(pendingScrapeItems);
  const modal = $("scrapeConfirmModal");
  modal.classList.remove("is-scraping", "hidden");
}

function closeScrapeConfirmModal() {
  if (scrapingBusy) return;
  pendingScrapeItems = [];
  $("scrapeConfirmModal").classList.add("hidden");
  $("scrapeConfirmModal").classList.remove("is-scraping");
}

async function animateScrapeCards(totalCards) {
  const modal = $("scrapeConfirmModal");
  const cards = [...modal.querySelectorAll(".scraping-animate-card")];
  modal.classList.add("is-scraping");
  $("btnConfirmScrape").disabled = true;
  $("btnCancelScrape").disabled = true;

  cards.forEach((cardEl, index) => {
    const delay = Math.min(index * 24, 760);
    cardEl.style.setProperty("--scrape-delay", `${delay}ms`);
  });

  requestAnimationFrame(() => {
    cards.forEach((cardEl) => cardEl.classList.add("is-falling"));
  });

  const soundBursts = Math.min(totalCards, SCRAPE_ANIMATION_SOUND_LIMIT);
  for (let i = 0; i < soundBursts; i += 1) {
    setTimeout(() => window.ArcaneAudio?.playSfx("cardReveal"), Math.min(i * 32, 900));
  }

  await scrapeDelay(Math.min(1420, 520 + cards.length * 22));
}

function openScrapeResultModal(scrape) {
  $("scrapeResultGold").textContent = `+${scrape.goldAwarded} gold`;
  $("scrapeResultCount").textContent = `${scrape.totalCards} card${scrape.totalCards === 1 ? "" : "s"} scraped`;
  $("scrapeResultModal").classList.remove("hidden");
}

function closeScrapeResultModal() {
  $("scrapeResultModal").classList.add("hidden");
}

async function scrapeCardItems(items) {
  if (scrapingBusy || items.length === 0 || !requireLoggedInForPlay()) return;
  scrapingBusy = true;
  renderScrapingSummary();
  try {
    const res = await arcaneFetch("/inventory/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not scrape cards.");

    await animateScrapeCards(data.scrape.totalCards);
    $("scrapeConfirmModal").classList.add("hidden");
    $("scrapeConfirmModal").classList.remove("is-scraping");
    pendingScrapeItems = [];
    scrapingSelections = {};
    updateAccountDisplay({
      gold: data.scrape.gold,
      cardCollection: data.scrape.cardCollection,
      unlockedCards: data.scrape.unlockedCards,
    });
    await loadScrapingDeckUsage();
    renderScrapingPanel();
    renderInventoryGrid();
    openScrapeResultModal(data.scrape);
  } catch (err) {
    $("scrapeConfirmModal")?.classList.remove("is-scraping");
    if ($("btnConfirmScrape")) $("btnConfirmScrape").disabled = false;
    if ($("btnCancelScrape")) $("btnCancelScrape").disabled = false;
    showToast(err.message || "Could not scrape cards.");
  } finally {
    scrapingBusy = false;
    renderScrapingSummary();
  }
}

async function scrapeSelectedCards() {
  openScrapeConfirmModal(selectedScrapeItems());
}

async function scrapeAllFilteredCards() {
  openScrapeConfirmModal(allFilteredScrapeItems());
}

function lazyLoadInventoryArt() {
  const lazyArtElements = document.querySelectorAll(".lazy-art");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const src = el.dataset.src;
          el.style.backgroundImage = `url('${src}')`;
          el.classList.remove("lazy-art");
          obs.unobserve(el);
        }
      });
    });
    lazyArtElements.forEach((el) => observer.observe(el));
  } else {
    // Fallback for older browsers
    lazyArtElements.forEach((el) => {
      const src = el.dataset.src;
      el.style.backgroundImage = `url('${src}')`;
      el.classList.remove("lazy-art");
    });
  }
}

["filterRarity", "filterCountry", "filterKeyword", "filterExpansion", "filterSort"].forEach((id) => {
  $(id).addEventListener("change", renderInventoryGrid);
});

$("filterName").addEventListener("input", renderInventoryGrid);

$("btnClearFilters").addEventListener("click", () => {
  $("filterName").value = "";
  $("filterRarity").value = "all";
  $("filterCountry").value = "all";
  $("filterKeyword").value = "all";
  $("filterExpansion").value = "all";
  $("filterSort").value = "default";
  renderInventoryGrid();
});

$("scrapingList")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-scrape-step]");
  if (!button) return;
  const cardId = button.dataset.cardId;
  const current = scrapingSelections[cardId] || 0;
  setScrapeSelection(cardId, current + Number(button.dataset.scrapeStep || 0));
});

$("scrapingList")?.addEventListener("input", (event) => {
  if (!event.target.classList.contains("scraping-qty-input")) return;
  setScrapeSelection(event.target.dataset.cardId, event.target.value);
});

$("btnScrapeCards")?.addEventListener("click", scrapeSelectedCards);
$("btnScrapeAllCards")?.addEventListener("click", scrapeAllFilteredCards);
$("btnCancelScrape")?.addEventListener("click", closeScrapeConfirmModal);
$("btnConfirmScrape")?.addEventListener("click", () => scrapeCardItems(pendingScrapeItems));
$("btnCloseScrapeResult")?.addEventListener("click", closeScrapeResultModal);
$("scrapeConfirmModal")?.addEventListener("click", (event) => {
  if (event.target.id === "scrapeConfirmModal") closeScrapeConfirmModal();
});
$("scrapeResultModal")?.addEventListener("click", (event) => {
  if (event.target.id === "scrapeResultModal") closeScrapeResultModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!$("scrapeResultModal")?.classList.contains("hidden")) closeScrapeResultModal();
  if (!$("scrapeConfirmModal")?.classList.contains("hidden")) closeScrapeConfirmModal();
});

["scrapingFilterRarity", "scrapingFilterCountry", "scrapingFilterKeyword", "scrapingFilterExpansion", "scrapingFilterSort"].forEach((id) => {
  $(id)?.addEventListener("change", () => {
    scrapingPage = 1;
    renderScrapingPanel();
  });
});

$("scrapingFilterName")?.addEventListener("input", () => {
  scrapingPage = 1;
  renderScrapingPanel();
});

$("btnClearScrapingFilters")?.addEventListener("click", () => {
  $("scrapingFilterName").value = "";
  $("scrapingFilterRarity").value = "all";
  $("scrapingFilterCountry").value = "all";
  $("scrapingFilterKeyword").value = "all";
  $("scrapingFilterExpansion").value = "all";
  $("scrapingFilterSort").value = "value-desc";
  scrapingPage = 1;
  renderScrapingPanel();
});

$("btnScrapingPrev")?.addEventListener("click", () => {
  scrapingPage = Math.max(1, scrapingPage - 1);
  renderScrapingPanel();
});

$("btnScrapingNext")?.addEventListener("click", () => {
  scrapingPage += 1;
  renderScrapingPanel();
});

$("btnInventoryBack").addEventListener("click", () => switchScreen("menu"));
$("tileInventory").addEventListener("click", () => openInventory());

// ---- Card zoom ----

function openCardZoom(card) {
  hideCardTooltip(); // it could still be showing from the hover/tap that triggered this click

  const zoomPanel = document.querySelector(".card-zoom-panel");
  if (zoomPanel) {
    zoomPanel.classList.remove("rarity-common", "rarity-rare", "rarity-legendary", "rarity-mythic", "rarity-souvenir");
    zoomPanel.classList.add(rarityClass(card));
  }

  const zoomArt = $("cardZoomArt");
  zoomArt.className = `minion-card card-zoom-art ${rarityClass(card)}`;
  zoomArt.innerHTML = inventoryCardFaceHTML(card);

  $("zoomName").textContent = card.name;

  const rarity = card.rarity || "common";
  const typeLabel = card.type === "minion" ? "Minion" : "Spell";
  $("zoomMeta").innerHTML = `
    <span class="zoom-chip zoom-rarity ${rarityClass(card)}">${RARITY_LABEL[rarity] || "Common"}</span>
    <span class="zoom-chip">${typeLabel}</span>
    <span class="zoom-chip">${card.cost} mana</span>
    ${card.race ? `<span class="zoom-chip">${escapeHtml(card.race)}</span>` : ""}
    <span class="zoom-chip">🏳 ${escapeHtml(card.country || "—")}</span>
  `;

  const keywords = activeKeywords(card);
  $("zoomKeywords").innerHTML = keywords
    .map((k) => `<span class="tooltip-kw kw-${k}">${KEYWORD_LABEL[k] || ""} ${KEYWORD_FULL_LABEL[k] || k}</span>`)
    .join("");

  $("zoomLore").textContent = card.lore || "";

  $("cardZoomOverlay").classList.remove("hidden");
}

function closeCardZoom() {
  $("cardZoomOverlay").classList.add("hidden");
}

$("btnCloseZoom").addEventListener("click", closeCardZoom);
$("cardZoomOverlay").addEventListener("click", (e) => {
  if (e.target.id === "cardZoomOverlay") closeCardZoom();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("cardZoomOverlay").classList.contains("hidden")) closeCardZoom();
});
