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

// ---- Human-readable ability descriptions ----

const INV_TRIGGER_LABEL = {
  onPlay: "On Play",
  onDeath: "On Death",
  onTurnStart: "At the start of your turn",
  onAnyTurnStart: "At the start of each turn",
  onAttackMinion: "After attacking a card",
};

const INV_EFFECT_DESCRIBER = {
  drawCards: (a) => `Draw ${a.value} card${a.value === 1 ? "" : "s"}.`,
  damageAllEnemyMinions: (a) => `Deal ${a.value} damage to all enemy minions.`,
  damageAllMinions: (a) => `Deal ${a.value} damage to all minions in play.`,
  damageEnemyHero: (a) => `Deal ${a.value} damage to the enemy hero.`,
  healAllFriendlyMinions: (a) => `Heal your minions for ${a.value}.`,
  healSelf: (a) => `Heal itself for ${a.value}.`,
  returnToDeck: () => "Return this card to your deck.",
  returnToDeckIfPlayedLessThan: (a) => `Return this card to your deck if it has been played fewer than ${a.value} times.`,
  destroySelf: () => "Destroy itself.",
  destroySelfIfPlayedAtLeast: (a) => `Destroy itself if it has been played at least ${a.value} times.`,
  summonMinion: (a) => {
    const def = typeof TCGCards !== "undefined" ? TCGCards.getCardById(a.cardId) : null;
    const name = def ? def.name : a.cardId;
    const count = a.count || 1;
    return `Summon ${count} ${name}${count === 1 ? "" : "s"}.`;
  },
  buffAllFriendlyMinions: (a) => {
    const parts = [];
    if (a.attack) parts.push(`+${a.attack} Attack`);
    if (a.health) parts.push(`+${a.health} Health`);
    return `Give your minions ${parts.join(" and ") || "a buff"}.`;
  },
};

function describeAbility(ability) {
  const trigger = INV_TRIGGER_LABEL[ability.trigger] || ability.trigger;
  const describer = INV_EFFECT_DESCRIBER[ability.effect];
  const body = describer ? describer(ability) : ability.effect;
  return `${trigger}: ${body}`;
}

// ---- Card list + filters ----

let inventoryAllCards = [];
let inventoryFiltersReady = false;

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

function populateInventoryFilters() {
  if (inventoryFiltersReady) return;
  const cards = getInventoryCards();
  const countries = [...new Set(cards.map((c) => c.country).filter(Boolean))].sort();
  const races = [...new Set(cards.map((c) => c.race).filter(Boolean))].sort();
  fillSelect($("filterCountry"), countries);
  fillSelect($("filterRace"), races);
  inventoryFiltersReady = true;
}

function currentInventoryFilters() {
  return {
    type: $("filterType").value,
    rarity: $("filterRarity").value,
    country: $("filterCountry").value,
    race: $("filterRace").value,
  };
}

function cardMatchesFilters(card, filters) {
  if (filters.type !== "all" && card.type !== filters.type) return false;
  if (filters.rarity !== "all" && card.rarity !== filters.rarity) return false;
  if (filters.country !== "all" && card.country !== filters.country) return false;
  if (filters.race !== "all" && card.race !== filters.race) return false;
  return true;
}

function openInventory() {
  if (!requireLoggedInForPlay()) return;
  populateInventoryFilters();
  renderInventoryGrid();
  switchScreen("inventory");
}

function inventoryCardFaceHTML(card, lazy = false) {
  return `
    ${cardArtHTML(card, lazy)}
    <div class="card-badges">${keywordBadgesHTML(card)}</div>
    <div class="card-footer">
      ${
        card.type === "minion"
          ? `<span class="card-stat atk">${card.attack}</span><span class="card-name">${escapeHtml(card.name)}</span><span class="card-stat hp">${card.health}</span>`
          : `<span class="card-name">${escapeHtml(card.name)}</span>${card.value !== undefined ? `<span class="card-stat val">${card.value}</span>` : ""}`
      }
    </div>
  `;
}

function lockedInventoryCardHTML(card) {
  return `
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
  const filtered = cards.filter((c) => cardMatchesFilters(c, filters));

  const unlockedCount = cards.filter(isCardUnlocked).length;
  $("inventoryCount").textContent = `${unlockedCount} / ${cards.length} unlocked`;
  $("inventoryEmpty").classList.toggle("hidden", filtered.length > 0);

  const grid = $("inventoryGrid");
  grid.innerHTML = "";

  filtered.forEach((card) => {
    const el = document.createElement("div");
    const unlocked = isCardUnlocked(card);
    el.className = `minion-card inventory-card ${rarityClass(card)}${unlocked ? "" : " inventory-card-locked"}`;
    el.innerHTML = unlocked ? `${inventoryCardFaceHTML(card, true)}<span class="inventory-card-count">x${getCardQuantity(card)}</span>` : lockedInventoryCardHTML(card);
    el.addEventListener("click", () => {
      if (!unlocked) return showToast("Unlock this card from packs.");
      openCardZoom(card);
    });
    grid.appendChild(el);
  });

  lazyLoadInventoryArt();
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

["filterType", "filterRarity", "filterCountry", "filterRace"].forEach((id) => {
  $(id).addEventListener("change", renderInventoryGrid);
});

$("btnClearFilters").addEventListener("click", () => {
  $("filterType").value = "all";
  $("filterRarity").value = "all";
  $("filterCountry").value = "all";
  $("filterRace").value = "all";
  renderInventoryGrid();
});

$("btnInventoryBack").addEventListener("click", () => switchScreen("menu"));
$("tileInventory").addEventListener("click", () => openInventory());

// ---- Card zoom ----

function openCardZoom(card) {
  hideCardTooltip(); // it could still be showing from the hover/tap that triggered this click

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

  const abilities = card.abilities || [];
  $("zoomAbilities").innerHTML = abilities.map((a) => `<p class="zoom-ability">${escapeHtml(describeAbility(a))}</p>`).join("");

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
