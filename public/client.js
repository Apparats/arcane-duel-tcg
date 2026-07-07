// ============================================================
// CLIENT — vanilla JS, no dependencies, no build step.
// ============================================================

const KEYWORD_LABEL = { divineShield: "*" };
const KEYWORD_ICON = {
  taunt:
    '<svg class="keyword-icon keyword-icon-taunt" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v6c0 4.4 2.9 7.4 7 9 4.1-1.6 7-4.6 7-9V6l-7-3Z" fill="currentColor"/></svg>',
  charge:
    '<svg class="keyword-icon keyword-icon-charge" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="currentColor"/></svg>',
};
const KEYWORD_FULL_LABEL = { taunt: "Taunt", charge: "Charge", divineShield: "Divine Shield" };
const RARITY_LABEL = { common: "Common", rare: "Rare", legendary: "Legendary", mythic: "Mythic" };
const DISCORD_CLIENT_ID = "1523179359106502716";
const TYPE_ICON = { minion: "⚔", spell: "✦" };

let ws = null;
let myState = null;          // last state received (server or local engine)
let selectedHandIndex = null; // index of the hand card selected to play
let selectedAttackerId = null; // instanceId of the minion selected to attack

let isLocalMode = false;     // true = "vs NPC" mode, no network
let localGame = null;        // TCGEngine.Game instance running in the browser
let accountState = null;
let lastEconomyUpdate = null;
let pendingInitialRewards = [];
const ENTER_GATE_KEY = "arcane_enter_gate_seen";
const DISCORD_ACTIVITY_READY_TIMEOUT_MS = 12000;
let quickplaySearching = false;
let enabledExpansionIds = null;
let activeMatchMode = null;
let discordActivityLoginRunning = false;

let lastAnimatedActionSeq = 0; // avoids replaying the same attack's animation
let lastRoundBannerKey = null;
let stateQueue = [];
let isApplyingStateQueue = false;
let stateQueueGeneration = 0;
let roundBannerMode = null;
let pendingHandPlayAnimation = null;
const SETTLE_DELAY = 460;      // ms we wait after an impact before "settling" the final state
const ROUND_BANNER_DELAY = 980;

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const closestElement = (target, selector) =>
  target && target.nodeType === Node.ELEMENT_NODE ? target.closest(selector) : null;
const hoverTooltipQuery = window.matchMedia?.("(hover: hover) and (pointer: fine)");

function canUseHoverTooltips() {
  return hoverTooltipQuery ? hoverTooltipQuery.matches : true;
}

function connect(onOpen) {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    if (onOpen) {
      if (ws.readyState === WebSocket.OPEN) onOpen();
      else ws.addEventListener("open", onOpen, { once: true });
    }
    return;
  }
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${protocol}//${location.host}`);

  if (onOpen) ws.addEventListener("open", onOpen, { once: true });
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    handleServerMessage(msg);
  });
  ws.addEventListener("close", () => {
    if (!isLocalMode) showToast("Lost connection to the server.");
  });
  ws.addEventListener("error", () => {
    if (!isLocalMode) showToast("Couldn't connect to the online server. Is it running?");
  });
}

function send(type, payload = {}) {
  if (isLocalMode) {
    handleLocalAction(type, payload);
    return;
  }
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

// ---------------- LOCAL MODE (VS NPC) ----------------

function startLocalMatch(playerName) {
  isLocalMode = true;
  activeMatchMode = "singleplayer";
  myState = null;
  lastAnimatedActionSeq = 0;
  lastRoundBannerKey = null;
  resetStateQueue();
  localGame = new TCGEngine.Game("LOCAL", playerName || "You", "NPC");
  switchScreen("game");
  refreshLocalState();
}

function startServerSingleplayer() {
  isLocalMode = false;
  activeMatchMode = "singleplayer";
  myState = null;
  lastAnimatedActionSeq = 0;
  lastRoundBannerKey = null;
  resetStateQueue();
  lastEconomyUpdate = null;
  connect(() => send("startSingleplayer", {}));
}

function handleLocalAction(type, payload) {
  try {
    if (type === "playCard") {
      localGame.playCard(0, payload.handIndex, payload.targetInstanceId || null);
    } else if (type === "attack") {
      localGame.attack(0, payload.attackerInstanceId, payload.targetInstanceId);
    } else if (type === "endTurn") {
      localGame.endTurn(0);
    } else if (type === "surrender") {
      localGame.surrender(0);
    }
  } catch (err) {
    if (type === "playCard") pendingHandPlayAnimation = null;
    showToast(err.message);
    return;
  }
  refreshLocalState();

  if (localGame.winner === null && localGame.turn === 1) {
    runNpcTurn();
  }
}

function refreshLocalState() {
  applyIncomingState(localGame.getStateFor(0));
}

async function runNpcTurn() {
  await sleep(1200);
  await TCGAi.npcTakeTurn(localGame, 1, { onStep: refreshLocalState, stepDelay: 1200 });
  refreshLocalState();
}

// ---------------- APPLY NEW STATE (with animations) ----------------
// The single entry point every new state passes through, whether
// online (WebSocket) or local (in-browser engine). Compares against
// the previous state to decide what to animate (damage, healing,
// attack, death) BEFORE rebuilding the DOM, and only then applies
// the final state.

function resetStateQueue() {
  stateQueue = [];
  isApplyingStateQueue = false;
  stateQueueGeneration += 1;
}

function applyIncomingState(newState) {
  stateQueue.push(newState);
  processStateQueue();
}

async function processStateQueue() {
  if (isApplyingStateQueue) return;

  isApplyingStateQueue = true;
  const generation = stateQueueGeneration;

  try {
    while (stateQueue.length > 0 && generation === stateQueueGeneration) {
      const nextState = stateQueue.shift();
      await applyQueuedState(nextState, generation);
    }
  } finally {
    if (generation === stateQueueGeneration) {
      isApplyingStateQueue = false;
      if (stateQueue.length > 0) processStateQueue();
    }
  }
}

async function applyQueuedState(newState, generation) {
  const prev = myState;
  const diff = prev ? computeAndPlayImpactAnimations(prev, newState) : { anyImpact: false, newMinions: [] };
  const roundKey = `${newState.turnNumber}:${newState.isYourTurn ? "self" : "opponent"}`;
  const isRoundChange = prev && hasTurnChanged(prev, newState) && roundKey !== lastRoundBannerKey;
  const delay = (diff.anyImpact ? SETTLE_DELAY : 0) + (isRoundChange ? ROUND_BANNER_DELAY : 0);

  if (isRoundChange) {
    lastRoundBannerKey = roundKey;
    showRoundBanner(`Round ${newState.turnNumber}`, { duration: ROUND_BANNER_DELAY });
  }

  if (delay > 0) await sleep(delay);
  if (generation !== stateQueueGeneration) return;

  myState = newState;
  clearSelection();
  render(myState);
  diff.newMinions.forEach(({ id, isSelf, cardId }) => {
    const el = findCardElement(id);
    if (!el) return;
    if (isSelf && animateCardFromHand(el, cardId)) return;
    el.classList.add("summoned");
  });
  if (myState.winner !== null) showEndOverlay(myState);
}

function hasTurnChanged(prev, next) {
  return prev.turnNumber !== next.turnNumber || prev.isYourTurn !== next.isYourTurn;
}

function showRoundBanner(titleText, { subtitle = "", duration = null, mode = "round" } = {}) {
  const banner = $("roundBanner");
  const title = $("roundBannerTitle");
  const subtitleEl = $("roundBannerSubtitle");
  if (!banner || !title || !subtitleEl) return;

  roundBannerMode = mode;
  title.textContent = titleText;
  subtitleEl.textContent = subtitle;
  subtitleEl.classList.toggle("hidden", !subtitle);
  banner.classList.remove("hidden", "round-banner-show", "round-banner-result");
  banner.classList.toggle("round-banner-result", mode === "result");
  void banner.offsetWidth;
  banner.classList.add("round-banner-show");

  clearTimeout(showRoundBanner._timer);
  if (duration !== null) {
    showRoundBanner._timer = setTimeout(hideRoundBanner, duration);
  }
}

function hideRoundBanner() {
  const banner = $("roundBanner");
  if (!banner) return;
  banner.classList.add("hidden");
  banner.classList.remove("round-banner-show", "round-banner-result");
  roundBannerMode = null;
}

function handleServerMessage(msg) {
  switch (msg.type) {
    case "roomCreated":
      setQuickplaySearching(false);
      $("roomInfo").classList.remove("hidden");
      $("roomCode").textContent = msg.payload.roomCode;
      break;
    case "quickplayQueued":
      setQuickplaySearching(true);
      break;
    case "matchStarted":
      setQuickplaySearching(false);
      activeMatchMode = activeMatchMode || "multiplayer";
      myState = null;
      lastAnimatedActionSeq = 0;
      lastRoundBannerKey = null;
      resetStateQueue();
      switchScreen("game");
      break;
    case "state":
      applyIncomingState(msg.payload);
      break;
    case "economyUpdate":
      lastEconomyUpdate = msg.payload;
      updateDailyRewardProgress(msg.payload);
      updateAccountDisplay({ ...(accountState?.user || {}), ...msg.payload });
      if (myState?.winner !== null) updateEndRewardText();
      break;
    case "opponentLeft":
      showToast("Your opponent disconnected.");
      break;
    case "error":
      pendingHandPlayAnimation = null;
      setQuickplaySearching(false);
      showToast(msg.payload.message);
      break;
  }
}

// ---------------- ANIMATIONS (diffed against the previous state) ----------------
// This is all purely visual: compares "before" vs "after" health/board
// and fires short-lived CSS classes. If something here fails (e.g. an
// element isn't found), it must not break the game — that's why every
// function checks the element exists before touching it.

function findCardElement(instanceId) {
  return document.querySelector(`.minion-card[data-instance-id="${instanceId}"]`);
}

function spawnFloatingNumber(targetEl, text, kind) {
  if (!targetEl) return;
  const boardEl = document.querySelector(".board");
  if (!boardEl) return;
  const targetRect = targetEl.getBoundingClientRect();
  const boardRect = boardEl.getBoundingClientRect();
  const span = document.createElement("div");
  span.className = `floating-number ${kind}`;
  span.textContent = text;
  span.style.left = `${targetRect.left - boardRect.left + targetRect.width / 2}px`;
  span.style.top = `${targetRect.top - boardRect.top + targetRect.height / 2}px`;
  boardEl.appendChild(span);
  setTimeout(() => span.remove(), 1150);
}

function flashDamage(el) {
  if (!el) return false;
  el.classList.add("impact", "flash-damage");
  setTimeout(() => el.classList.remove("impact", "flash-damage"), 650);
  return true;
}

function playDamageSfx() {
  window.ArcaneAudio?.playSfx("hit");
  setTimeout(() => window.ArcaneAudio?.playSfx("damage"), 70);
}

function flashHeal(el) {
  if (!el) return false;
  el.classList.add("flash-heal");
  setTimeout(() => el.classList.remove("flash-heal"), 650);
  return true;
}

function diffAndFlashHero(prevHero, nextHero, panelEl) {
  if (!prevHero || !nextHero) return false;
  const delta = nextHero.health - prevHero.health;
  if (delta === 0) return false;
  if (delta < 0) {
    spawnFloatingNumber(panelEl, `${delta}`, "damage");
    return flashDamage(panelEl);
  }
  spawnFloatingNumber(panelEl, `+${delta}`, "heal");
  return flashHeal(panelEl);
}

function diffAndFlashBoard(prevBoard, nextBoard) {
  const nextById = new Map(nextBoard.map((m) => [m.instanceId, m]));
  let any = false;
  prevBoard.forEach((prevM) => {
    const nextM = nextById.get(prevM.instanceId);
    if (!nextM) return; // died — handled by animateDeaths
    const delta = nextM.health - prevM.health;
    if (delta === 0) return;
    const el = findCardElement(prevM.instanceId);
    if (!el) return;
    if (delta < 0) {
      spawnFloatingNumber(el, `${delta}`, "damage");
      if (flashDamage(el)) any = true;
    } else {
      spawnFloatingNumber(el, `+${delta}`, "heal");
      if (flashHeal(el)) any = true;
    }
  });
  return any;
}

function animateDeaths(prevBoard, nextBoard) {
  const nextIds = new Set(nextBoard.map((m) => m.instanceId));
  let any = false;
  prevBoard.forEach((m) => {
    if (nextIds.has(m.instanceId)) return;
    const el = findCardElement(m.instanceId);
    if (el) {
      el.classList.add("dying");
      any = true;
    }
  });
  return any;
}

function rectCenter(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function animateCardFromHand(cardEl, cardId) {
  if (!pendingHandPlayAnimation || pendingHandPlayAnimation.cardId !== cardId) return false;
  const sourceRect = pendingHandPlayAnimation.rect;
  pendingHandPlayAnimation = null;
  if (!sourceRect || !cardEl.animate) return false;

  const targetRect = cardEl.getBoundingClientRect();
  const source = rectCenter(sourceRect);
  const target = rectCenter(targetRect);
  const dx = source.x - target.x;
  const dy = source.y - target.y;
  cardEl.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(0.92)`, opacity: 0.92, filter: "brightness(1.25)" },
      { transform: "translate(0, 0) scale(1.04)", opacity: 1, filter: "brightness(1.12)", offset: 0.78 },
      { transform: "translate(0, 0) scale(1)", opacity: 1, filter: "brightness(1)" },
    ],
    { duration: 420, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
  );
  cardEl.classList.add("summoned-from-hand");
  setTimeout(() => cardEl.classList.remove("summoned-from-hand"), 440);
  return true;
}

function animateAttackLunge(prev, action) {
  const attackerEl = findCardElement(action.attackerInstanceId);
  if (!attackerEl) return false;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion || !attackerEl.animate) return false;
  const attackerIsSelf = prev.me.board.some((m) => m.instanceId === action.attackerInstanceId);
  const targetEl = action.targetInstanceId
    ? findCardElement(action.targetInstanceId)
    : attackerIsSelf
      ? $("oppHero")
      : $("selfHero");
  let dx = 0;
  let dy = attackerIsSelf ? -24 : 24;
  if (targetEl) {
    const attackerCenter = rectCenter(attackerEl.getBoundingClientRect());
    const targetCenter = rectCenter(targetEl.getBoundingClientRect());
    dx = (targetCenter.x - attackerCenter.x) * 0.82;
    dy = (targetCenter.y - attackerCenter.y) * 0.82;
  }
  attackerEl.getAnimations?.().forEach((animation) => {
    if (animation.animationName === "card-lunge") animation.cancel();
  });
  attackerEl.style.zIndex = "8";
  attackerEl.animate(
    [
      { transform: "translate(0, 0) scale(1)", filter: "brightness(1)" },
      { transform: `translate(${dx}px, ${dy}px) scale(1.06)`, filter: "brightness(1.18)", offset: 0.38 },
      { transform: `translate(${dx * 0.16}px, ${dy * 0.16}px) scale(1.02)`, filter: "brightness(1.08)", offset: 0.7 },
      { transform: "translate(0, 0) scale(1)", filter: "brightness(1)" },
    ],
    { duration: 430, easing: "cubic-bezier(0.18, 0.85, 0.22, 1)" }
  );
  setTimeout(() => {
    attackerEl.style.zIndex = "";
  }, 440);
  return true;
}

// Runs BEFORE replacing the DOM with the new state: while the old
// nodes still exist, it adds animation classes to them. Returns what
// happened, so applyIncomingState can decide how long to wait before
// settling the final state (and which minions deserve the summon pop).
function computeAndPlayImpactAnimations(prev, next) {
  let anyImpact = false;

  if (next.lastAction && next.lastAction.type === "attack" && next.lastAction.seq > lastAnimatedActionSeq) {
    lastAnimatedActionSeq = next.lastAction.seq;
    if (animateAttackLunge(prev, next.lastAction)) anyImpact = true;
  }

  if (diffAndFlashHero(prev.me, next.me, $("selfHero"))) anyImpact = true;
  if (diffAndFlashHero(prev.opponent, next.opponent, $("oppHero"))) anyImpact = true;

  if (diffAndFlashBoard(prev.me.board, next.me.board)) anyImpact = true;
  if (diffAndFlashBoard(prev.opponent.board, next.opponent.board)) anyImpact = true;

  if (animateDeaths(prev.me.board, next.me.board)) anyImpact = true;
  if (animateDeaths(prev.opponent.board, next.opponent.board)) anyImpact = true;

  if (anyDamageTaken(prev, next)) playDamageSfx();

  const prevIds = new Set([...prev.me.board, ...prev.opponent.board].map((m) => m.instanceId));
  const newMinions = [
    ...next.me.board.map((m) => ({ id: m.instanceId, cardId: m.cardId, isSelf: true })),
    ...next.opponent.board.map((m) => ({ id: m.instanceId, cardId: m.cardId, isSelf: false })),
  ].filter((m) => !prevIds.has(m.id));
  const enemySummoned = next.opponent.board.some((m) => !prevIds.has(m.instanceId));
  if (enemySummoned) window.ArcaneAudio?.playSfx("cardPlay");

  return { anyImpact, newMinions };
}

function heroTookDamage(prevHero, nextHero) {
  return Boolean(prevHero && nextHero && nextHero.health < prevHero.health);
}

function boardTookDamage(prevBoard, nextBoard) {
  const nextById = new Map(nextBoard.map((m) => [m.instanceId, m]));
  return prevBoard.some((prevM) => {
    const nextM = nextById.get(prevM.instanceId);
    return !nextM || nextM.health < prevM.health;
  });
}

function anyDamageTaken(prev, next) {
  return (
    heroTookDamage(prev.me, next.me) ||
    heroTookDamage(prev.opponent, next.opponent) ||
    boardTookDamage(prev.me.board, next.me.board) ||
    boardTookDamage(prev.opponent.board, next.opponent.board)
  );
}

function showToast(text) {
  const t = $("toast");
  t.textContent = text;
  t.classList.remove("hidden");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.add("hidden"), 2800);
}

function switchScreen(name) {
  hideCardTooltip();
  const screenIds = ["auth", "enter", "menu", "lobby", "inventory", "shop", "trade", "game"];
  const loading = $("loadingScreen");
  if (!loading) {
    screenIds.forEach((screen) => {
      const el = $(`screen-${screen}`);
      if (el) el.classList.toggle("hidden", name !== screen);
    });
    window.ArcaneAudio?.onScreenChange(name);
    return;
  }

  // Fade in loading screen
  loading.classList.remove("hidden");

  // Wait for loading screen to become opaque
  setTimeout(() => {
    screenIds.forEach((screen) => {
      const el = $(`screen-${screen}`);
      if (el) el.classList.toggle("hidden", name !== screen);
    });
    window.ArcaneAudio?.onScreenChange(name);

    // Fade out loading screen after a short delay to feel deliberate
    setTimeout(() => {
      loading.classList.add("hidden");
    }, 200);
  }, 250);
}

// ---------------- MAIN MENU ----------------

function openLobby(mode) {
  if (!requireLoggedInForPlay()) return;
  $("singleplayerActions").classList.toggle("hidden", mode !== "singleplayer");
  $("multiplayerActions").classList.toggle("hidden", mode !== "multiplayer");
  $("lobbySubtitle").textContent =
    mode === "singleplayer"
      ? "Practice against the NPC and earn daily gold"
      : "Online 1v1 — create a room or join one with a code";
  $("roomInfo").classList.add("hidden");
  $("lobbyError").classList.add("hidden");
  if (mode === "multiplayer") {
    $("lobbySubtitle").textContent = "Online 1v1 - find a match or use a room code";
    setLobbyTab("quickplay");
  }
  switchScreen("lobby");
}

$("tileSingleplayer").addEventListener("click", () => {
  if (!requireLoggedInForPlay()) return;
  startServerSingleplayer();
});
$("tileMultiplayer").addEventListener("click", () => openLobby("multiplayer"));

document.querySelectorAll(".menu-tile-locked").forEach((tile) => {
  tile.addEventListener("click", () => {
    showToast(`${tile.dataset.lockedName} isn't available yet — coming soon.`);
  });
});

$("btnBackToMenu").addEventListener("click", () => {
  setQuickplaySearching(false);
  send("cancelQuickplay", {});
  switchScreen("menu");
});

// ---------------- LOBBY ----------------

function setLobbyTab(tab) {
  const isQuickplay = tab === "quickplay";
  $("tabRoomCode").classList.toggle("active", !isQuickplay);
  $("tabQuickplay").classList.toggle("active", isQuickplay);
  $("roomCodePanel").classList.toggle("hidden", isQuickplay);
  $("quickplayPanel").classList.toggle("hidden", !isQuickplay);
  $("roomInfo").classList.add("hidden");
}

function setQuickplaySearching(searching) {
  quickplaySearching = searching;
  $("btnQuickplay").classList.toggle("hidden", searching);
  $("btnCancelQuickplay").classList.toggle("hidden", !searching);
  $("quickplayStatus").classList.toggle("searching", searching);
  $("quickplayStatus").textContent = searching ? "Searching for an opponent" : "Queue for a basic online 1v1 match.";
}

$("tabRoomCode").addEventListener("click", () => setLobbyTab("room"));
$("tabQuickplay").addEventListener("click", () => setLobbyTab("quickplay"));
$("tabRanked").addEventListener("click", () => showToast("Ranked isn't available yet."));

$("btnCreate").addEventListener("click", () => {
  if (!requireLoggedInForPlay()) return;
  setQuickplaySearching(false);
  connect(() => send("createRoom", {}));
});

$("btnJoin").addEventListener("click", () => {
  if (!requireLoggedInForPlay()) return;
  const roomCode = $("joinCode").value.trim();
  if (!roomCode) return showToast("Enter a room code.");
  setQuickplaySearching(false);
  connect(() => send("joinRoom", { roomCode }));
});

$("btnQuickplay").addEventListener("click", () => {
  if (!requireLoggedInForPlay()) return;
  setQuickplaySearching(true);
  connect(() => send("quickplay", {}));
});

$("btnCancelQuickplay").addEventListener("click", () => {
  setQuickplaySearching(false);
  send("cancelQuickplay", {});
});

$("btnStartSingle").addEventListener("click", () => {
  if (!requireLoggedInForPlay()) return;
  startServerSingleplayer();
});

// ---------------- RENDER ----------------

function render(state) {
  // A full re-render is about to replace every card node, including
  // possibly the one currently under the cursor/finger — hide any open
  // tooltip first, since its mouseleave will never fire on a node that
  // no longer exists.
  hideCardTooltip();

  // Heroes
  $("selfName").textContent = state.me.name;
  setHeroAvatar($("selfAvatar"), state.me);
  $("selfHealth").textContent = state.me.health;
  $("selfMana").textContent = state.me.manaCurrent;
  $("selfManaMax").textContent = state.me.manaMax;
  $("selfDeckCount").textContent = state.me.deckCount + " 🂠";

  $("oppName").textContent = state.opponent.name;
  setHeroAvatar($("oppAvatar"), state.opponent);
  $("oppHealth").textContent = state.opponent.health;
  $("oppMana").textContent = state.opponent.manaCurrent;
  $("oppManaMax").textContent = state.opponent.manaMax;
  $("oppDeckCount").textContent = state.opponent.deckCount + " 🂠";

  $("selfHero").classList.toggle("active-turn", state.isYourTurn);
  $("oppHero").classList.toggle("active-turn", !state.isYourTurn);

  // Opponent's hand (card backs)
  $("oppHandBack").innerHTML = "";
  for (let i = 0; i < state.opponent.handCount; i++) {
    const d = document.createElement("div");
    d.className = "minion-card";
    d.style.cssText = "width:26px;height:26px;background:linear-gradient(160deg,#2a2440,#1a1526);opacity:.85;cursor:default;border-radius:4px;";
    $("oppHandBack").appendChild(d);
  }

  // Turn
  $("turnSeal").textContent = `#${state.turnNumber}`;
  $("turnLabel").textContent = state.isYourTurn
    ? "Your turn"
    : `${state.opponent.name}'s turn`;

  // Log
  $("gameLog").innerHTML = state.log.map((l) => `<div>${escapeHtml(l)}</div>`).join("");
  $("gameLog").scrollTop = $("gameLog").scrollHeight;

  // Boards
  renderBoard($("oppBoard"), state.opponent.board, false);
  renderBoard($("selfBoard"), state.me.board, true);

  // Own hand
  renderHand(state);

  // End turn button
  $("btnEndTurn").disabled = !state.isYourTurn;

  updateTargetableHighlights(state);
}

function setHeroAvatar(el, player) {
  if (!el) return;
  const avatarUrl = player && player.avatarUrl;
  el.classList.toggle("hero-avatar-empty", !avatarUrl);
  if (avatarUrl) {
    el.style.backgroundImage = `url("${escapeHtmlAttr(avatarUrl)}")`;
    el.textContent = "";
    return;
  }
  el.style.backgroundImage = "";
  el.textContent = (player?.name || "?").trim().charAt(0).toUpperCase();
}

function renderBoard(container, board, isSelf) {
  container.innerHTML = "";
  board.forEach((m) => {
    const el = document.createElement("div");
    el.className = `minion-card ${rarityClass(m)}`;
    if (m.keywords.includes("taunt")) el.classList.add("taunt");
    if (m.divineShield) el.classList.add("shield"); // only while the shield is still active
    if (isSelf && !m.canAttack) el.classList.add("exhausted");
    if (isSelf && m.instanceId === selectedAttackerId) el.classList.add("selected");
    el.dataset.instanceId = m.instanceId;

    el.innerHTML = `
      ${cardArtHTML(m)}
      <div class="card-badges">${keywordBadgesHTML(m)}</div>
      <div class="card-footer">
        <span class="card-stat atk">${m.attack}</span>
        <span class="card-name">${escapeHtml(m.name)}</span>
        <span class="card-stat hp">${m.health}</span>
      </div>
    `;

    el.addEventListener("click", () => onMinionClick(m, isSelf));
    attachCardTooltip(el, m);
    container.appendChild(el);
  });
}

function renderHand(state) {
  const container = $("handArea");
  container.innerHTML = "";
  state.me.hand.forEach((card, idx) => {
    const el = document.createElement("div");
    el.className = `hand-card ${rarityClass(card)}`;
    if (card.type === "spell") el.classList.add("spell");
    if (card.cost > state.me.manaCurrent) el.classList.add("unaffordable");
    if (idx === selectedHandIndex) el.classList.add("selected");

    el.innerHTML = `
      ${cardArtHTML(card)}
      <div class="cost">${card.cost}</div>
      <div class="card-badges">${keywordBadgesHTML(card)}</div>
      <div class="card-footer">
        ${
          card.type === "minion"
            ? `<span class="card-stat atk">${card.attack}</span><span class="card-name">${escapeHtml(card.name)}</span><span class="card-stat hp">${card.health}</span>`
            : `<span class="card-name">${escapeHtml(card.name)}</span>${card.value !== undefined ? `<span class="card-stat val">${card.value}</span>` : ""}`
        }
      </div>
    `;

    el.addEventListener("click", () => onHandCardClick(idx, card, state, el));
    attachCardTooltip(el, card);
    container.appendChild(el);
  });
}

// ---------------- INTERACTION ----------------

function onHandCardClick(idx, card, state, cardEl = null) {
  if (!state.isYourTurn) return showToast("It's not your turn.");
  if (card.cost > state.me.manaCurrent) return showToast("Not enough mana.");

  selectedAttackerId = null;

  // Minion: played immediately (no target)
  if (card.type === "minion") {
    selectedHandIndex = null;
    pendingHandPlayAnimation = cardEl
      ? { cardId: card.id, rect: cardEl.getBoundingClientRect(), createdAt: performance.now() }
      : null;
    window.ArcaneAudio?.playSfx("cardPlay");
    send("playCard", { handIndex: idx, targetInstanceId: null });
    return;
  }

  // Draw spell, or a spell that works purely off "abilities" (no
  // classic effect): neither one needs you to pick a target.
  if (card.effect === "draw" || !card.effect) {
    selectedHandIndex = null;
    window.ArcaneAudio?.playSfx("cardPlay");
    send("playCard", { handIndex: idx, targetInstanceId: null });
    return;
  }

  // Damage/heal spell: ask for a target
  selectedHandIndex = idx;
  showTargetHint(card.effect === "heal" ? "Choose who to heal (or your own hero)" : "Choose a target (or the enemy hero)");
  render(myState);
}

function onMinionClick(minion, isSelf) {
  const state = myState;
  if (!state.isYourTurn) return showToast("It's not your turn.");

  // Case 1: I have a spell selected, waiting for a target
  if (selectedHandIndex !== null) {
    window.ArcaneAudio?.playSfx("cardPlay");
    send("playCard", { handIndex: selectedHandIndex, targetInstanceId: minion.instanceId });
    selectedHandIndex = null;
    hideTargetHint();
    return;
  }

  // Case 2: I have an attacker selected and I click an enemy minion
  if (selectedAttackerId && !isSelf) {
    window.ArcaneAudio?.playSfx("attack");
    send("attack", { attackerInstanceId: selectedAttackerId, targetInstanceId: minion.instanceId });
    selectedAttackerId = null;
    return;
  }

  // Case 3: I select one of my own minions to attack with
  if (isSelf) {
    if (!minion.canAttack) return showToast("That minion can't attack yet.");
    selectedAttackerId = minion.instanceId;
    render(state);
  }
}

function onHeroClick(isSelf) {
  const state = myState;
  if (!state) return;
  if (!state.isYourTurn) return showToast("It's not your turn.");

  if (selectedHandIndex !== null) {
    const target = isSelf ? "faceSelf" : "faceEnemy";
    window.ArcaneAudio?.playSfx("cardPlay");
    send("playCard", { handIndex: selectedHandIndex, targetInstanceId: target });
    selectedHandIndex = null;
    hideTargetHint();
    return;
  }

  if (selectedAttackerId && !isSelf) {
    window.ArcaneAudio?.playSfx("attack");
    send("attack", { attackerInstanceId: selectedAttackerId, targetInstanceId: "face" });
    selectedAttackerId = null;
  }
}

$("oppHero").addEventListener("click", () => onHeroClick(false));
$("selfHero").addEventListener("click", () => onHeroClick(true));

$("btnEndTurn").addEventListener("click", () => {
  clearSelection();
  window.ArcaneAudio?.playSfx("endTurn");
  send("endTurn", {});
});

$("btnSurrender").addEventListener("click", () => {
  if (!myState || myState.winner !== null) return;
  showSurrenderModal();
});

function showSurrenderModal() {
  clearSelection();
  $("surrenderModal").classList.remove("hidden");
}

function hideSurrenderModal() {
  $("surrenderModal").classList.add("hidden");
}

function confirmSurrender() {
  if (!myState || myState.winner !== null) {
    hideSurrenderModal();
    return;
  }
  hideSurrenderModal();
  clearSelection();
  window.ArcaneAudio?.playSfx("surrender");
  send("surrender", {});
}

$("btnCancelSurrender").addEventListener("click", hideSurrenderModal);
$("btnConfirmSurrender").addEventListener("click", confirmSurrender);
$("surrenderModal").addEventListener("click", (event) => {
  if (event.target.id === "surrenderModal") hideSurrenderModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("surrenderModal").classList.contains("hidden")) hideSurrenderModal();
});

$("cancelTarget").addEventListener("click", () => {
  clearSelection();
  render(myState);
});

function clearSelection() {
  selectedHandIndex = null;
  selectedAttackerId = null;
  hideTargetHint();
}

function showTargetHint(text) {
  $("targetHint").classList.remove("hidden");
  $("targetHint").firstChild.textContent = text + " — ";
}
function hideTargetHint() {
  $("targetHint").classList.add("hidden");
}

function updateTargetableHighlights(state) {
  const targetingSpell = selectedHandIndex !== null;
  const targetingAttack = selectedAttackerId !== null;

  $("oppHero").classList.toggle("targetable", targetingSpell || targetingAttack);
  $("selfHero").classList.toggle("targetable", targetingSpell);

  document.querySelectorAll("#oppBoard .minion-card").forEach((el) => {
    el.classList.toggle("targetable", targetingSpell || targetingAttack);
  });
  document.querySelectorAll("#selfBoard .minion-card").forEach((el) => {
    el.classList.toggle("targetable", targetingSpell);
  });
}

// ---------------- END OF MATCH ----------------

function showEndOverlay(state) {
  let title = "Defeat";
  let resultSfx = "defeat";
  if (state.winner === "draw") {
    title = "Draw";
    resultSfx = null;
  } else if (state.winner === state.you) {
    title = "Victory";
    resultSfx = "victory";
  }
  updateEndRewardText();
  $("overlayEnd").classList.add("hidden");
  if (resultSfx) window.ArcaneAudio?.playSfx(resultSfx);
  showRoundBanner(title, {
    subtitle: resultBannerSubtitle($("endReward")?.textContent || ""),
    mode: "result",
  });
}

function resultBannerSubtitle(rewardText = "") {
  return rewardText ? `${rewardText} - Press anywhere to return to menu` : "Press anywhere to return to menu";
}

function updateEndRewardText() {
  const reward = $("endReward");
  if (!reward) return;
  if (lastEconomyUpdate) {
    const parts = [];
    if (lastEconomyUpdate.awardedGold) parts.push(`+${lastEconomyUpdate.awardedGold} gold`);
    if (lastEconomyUpdate.penaltyGold) parts.push(`-${lastEconomyUpdate.penaltyGold} surrender penalty`);
    if (!parts.length) parts.push("Daily reward limit reached");
    reward.textContent = `${parts.join(" · ")} (${lastEconomyUpdate.dailyEarned}/${lastEconomyUpdate.dailyLimit} today)`;
  } else {
    reward.textContent = "";
  }
  if (roundBannerMode === "result") {
    const subtitle = $("roundBannerSubtitle");
    if (subtitle) subtitle.textContent = resultBannerSubtitle(reward.textContent);
  }
}

$("roundBanner").addEventListener("click", () => {
  if (roundBannerMode === "result") returnToMenuFromMatch();
});

function returnToMenuFromMatch() {
  hideRoundBanner();
  $("overlayEnd").classList.add("hidden");
  clearSelection();
  switchScreen("menu");
}

$("btnRestart").addEventListener("click", () => {
  returnToMenuFromMatch();
});

// Returns the circular keyword badges for the card's corner. Divine
// Shield only shows while it's still active: once consumed
// (m.divineShield === false on a minion already in play), it
// disappears — in hand (where there's no "consumed" state yet) it
// always shows.
function activeKeywords(card) {
  const keywords = card.keywords || [];
  return keywords.filter((k) => !(k === "divineShield" && card.divineShield === false));
}

function keywordBadgesHTML(card) {
  return activeKeywords(card)
    .map((k) => `<span class="keyword-badge kw-${k}">${keywordIconHTML(k)}</span>`)
    .join("");
}

function keywordIconHTML(keyword) {
  return KEYWORD_ICON[keyword] || KEYWORD_LABEL[keyword] || "?";
}

function rarityClass(card) {
  return `rarity-${card.rarity || "common"}`;
}

// Returns the art layer's HTML: an image if the card has one, or a
// generic icon based on type if it doesn't have art yet.
function cardArtHTML(card, lazy = false) {
  if (card.image) {
    if (lazy) {
      return `<div class="card-art lazy-art" data-src="${escapeHtmlAttr(card.image)}"></div>`;
    }
    return `<div class="card-art" style="background-image:url('${escapeHtmlAttr(card.image)}')"></div>`;
  }
  const icon = TYPE_ICON[card.type] || "?";
  return `<div class="card-art card-art-placeholder"><span class="card-art-icon">${icon}</span></div>`;
}

function escapeHtmlAttr(str) {
  return String(str).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}

// ---------------- CARD TOOLTIP ----------------

function attachCardTooltip(el, card) {
  el.addEventListener("pointerdown", () => {
    if (!canUseHoverTooltips()) hideCardTooltip();
  });
  if (!canUseHoverTooltips()) return;

  el.addEventListener("mouseenter", (e) => showCardTooltip(card, e));
  el.addEventListener("mousemove", positionCardTooltip);
  el.addEventListener("mouseleave", hideCardTooltip);
}

function showCardTooltip(card, e) {
  if (!canUseHoverTooltips()) return;
  const t = $("cardTooltip");
  const rarity = card.rarity || "common";

  const keywords = activeKeywords(card);
  const keywordsHTML = keywords.length
    ? `<div class="tooltip-keywords">${keywords
        .map((k) => `<span class="tooltip-kw kw-${k}">${keywordIconHTML(k)} ${KEYWORD_FULL_LABEL[k] || k}</span>`)
        .join("")}</div>`
    : "";

  t.innerHTML = `
    <div class="tooltip-header">
      <span class="tooltip-name">${escapeHtml(card.name)}</span>
      <span class="tooltip-rarity ${rarityClass(card)}">${RARITY_LABEL[rarity] || "Common"}</span>
    </div>
    <div class="tooltip-meta">
      ${card.race ? `<span class="tooltip-race">${escapeHtml(card.race)}</span>` : ""}
      <span class="tooltip-country">🏳 ${escapeHtml(card.country || "—")}</span>
    </div>
    ${keywordsHTML}
    ${card.lore ? `<div class="tooltip-lore">${escapeHtml(card.lore)}</div>` : ""}
  `;
  t.classList.remove("hidden");
  positionCardTooltip(e);
}

function positionCardTooltip(e) {
  if (!e || !canUseHoverTooltips()) return;
  const t = $("cardTooltip");
  if (t.classList.contains("hidden")) return;
  const offset = 18;
  const rect = t.getBoundingClientRect();
  let x = e.clientX + offset;
  let y = e.clientY + offset;
  if (x + rect.width > window.innerWidth - 8) x = e.clientX - rect.width - offset;
  if (y + rect.height > window.innerHeight - 8) y = e.clientY - rect.height - offset;
  t.style.left = `${Math.max(8, x)}px`;
  t.style.top = `${Math.max(8, y)}px`;
}

function hideCardTooltip() {
  const tooltip = $("cardTooltip");
  if (!tooltip) return;
  tooltip.classList.add("hidden");
  tooltip.style.left = "";
  tooltip.style.top = "";
}

// Touch devices have no real "mouseleave" — the only way a tooltip
// closes there is by tapping somewhere else. This covers that case
// (and is harmless on desktop too).
document.addEventListener("pointerdown", (e) => {
  if (!canUseHoverTooltips() || !closestElement(e.target, ".minion-card, .hand-card")) hideCardTooltip();
});
document.addEventListener("scroll", hideCardTooltip, { capture: true, passive: true });
window.addEventListener("resize", hideCardTooltip);
window.addEventListener("blur", hideCardTooltip);
hoverTooltipQuery?.addEventListener?.("change", hideCardTooltip);

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// Note: the WebSocket connection no longer opens automatically on page
// load. It only connects once the user chooses "Create room" or "Join"
// (see connect() above). That way "vs NPC" mode works 100% offline,
// even opening public/index.html directly by double-clicking it, with
// no need for the Node server to be running.

// ---------------- ACCOUNT / DISCORD LOGIN ----------------
// Entirely optional: if the server has no Discord/MongoDB config (or
// there's no server at all, e.g. opening index.html directly), this
// silently does nothing and the widget stays hidden. The rest of the
// game never depends on being logged in.

async function initAccountWidget() {
  let data;
  accountState = { authEnabled: false, loggedIn: false, user: null };
  switchScreen("auth");
  setAuthGate("Checking Discord session...", false);
  try {
    const res = await fetch("/auth/me");
    data = await res.json();
  } catch (err) {
    setAuthGate("Start the local server to continue with Discord login.", false);
    return; // no server reachable (e.g. offline vs-NPC file:// usage) — nothing to show
  }

  await loadEnabledExpansions();
  accountState = data;
  if (!data.authEnabled) {
    setAuthGate("Discord login is not configured yet. Add MongoDB, Discord OAuth, and JWT values to .env.", false);
    return;
  }

  $("accountWidget").classList.remove("hidden");
  if (data.loggedIn && data.user) {
    $("btnLoginDiscord").classList.add("hidden");
    $("accountProfile").classList.remove("hidden");
    updateAccountDisplay(data.user);
    if (data.dailyLoginReward?.claimed) {
      showToast(`Daily login reward: +${data.dailyLoginReward.goldAwarded} gold`);
    }
    if (data.user.avatarUrl) {
      $("accountAvatar").src = data.user.avatarUrl;
      $("accountAvatar").classList.remove("hidden");
    }
    pendingInitialRewards = data.rewards || [];
    if (hasSeenEnterGate()) {
      switchScreen("menu");
      if (pendingInitialRewards.length > 0) {
        queueInitialRewards(pendingInitialRewards);
        pendingInitialRewards = [];
      }
    } else {
      switchScreen("enter");
    }
  } else {
    if (isDiscordActivityEnvironment()) {
      setAuthGate("Login with Discord to enter Arcana TCG.", true);
      $("btnLoginDiscord").classList.remove("hidden");
      return;
    }
    setAuthGate("Login with Discord to enter Arcana TCG.", true);
    $("btnLoginDiscord").classList.remove("hidden");
  }
}

function isDiscordActivityEnvironment() {
  const params = new URLSearchParams(window.location.search);
  let isEmbedded = false;
  try {
    isEmbedded = window.self !== window.top;
  } catch {
    isEmbedded = true;
  }

  return (
    isEmbedded ||
    params.has("frame_id") ||
    params.has("instance_id") ||
    params.has("platform") ||
    document.referrer.includes("discord.com") ||
    document.referrer.includes("discordsays.com")
  );
}

function getDiscordActivityContext() {
  let embedded = false;
  try {
    embedded = window.self !== window.top;
  } catch {
    embedded = true;
  }

  let referrerHost = "";
  try {
    referrerHost = document.referrer ? new URL(document.referrer).host : "";
  } catch {
    referrerHost = "invalid";
  }

  return {
    embedded,
    hasReferrer: Boolean(document.referrer),
    hrefHost: window.location.host,
    referrerHost,
    searchKeys: Array.from(new URLSearchParams(window.location.search).keys()),
  };
}

function reportClientLog(type, payload = {}) {
  fetch("/client-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      ...payload,
      context: getDiscordActivityContext(),
    }),
  }).catch(() => {});
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

async function createDiscordActivitySession(accessToken) {
  const response = await fetch("/auth/discord/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.error || "Discord Activity session failed.");
    err.stage = "token";
    throw err;
  }
  return data;
}

async function loginWithDiscordActivity({ automatic = false, showFailure = true } = {}) {
  if (discordActivityLoginRunning) return false;
  if (!accountState?.discordClientId) {
    setAuthGate("Discord Activity login is not configured yet.", true);
    return false;
  }

  discordActivityLoginRunning = true;
  setAuthGate(automatic ? "Waiting for Discord..." : "Opening Discord authorization...", false);

  try {
    const { DiscordSDK } = await import("./vendor/discord-embedded-app-sdk/index.mjs");
    const discordSdk = new DiscordSDK(accountState.discordClientId || DISCORD_CLIENT_ID, {
      disableConsoleLogOverride: true,
    });
    await withTimeout(discordSdk.ready(), DISCORD_ACTIVITY_READY_TIMEOUT_MS, "Discord Activity SDK was not ready.")
      .catch((err) => {
        err.stage = "ready";
        throw err;
      });

    const existingAuth = await discordSdk.commands.authenticate({}).catch(() => null);
    if (existingAuth?.access_token) {
      await createDiscordActivitySession(existingAuth.access_token);
      discordActivityLoginRunning = false;
      await initAccountWidget();
      return true;
    }

    const state =
      window.crypto?.randomUUID?.() ||
      `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    let code;
    try {
      const authorization = await discordSdk.commands.authorize({
        client_id: accountState.discordClientId,
        response_type: "code",
        state,
        prompt: "none",
        scope: ["identify", "applications.commands"],
      });
      code = authorization.code;
    } catch (err) {
      if (String(err.message || err).includes("Already authenticated")) {
        const auth = await discordSdk.commands.authenticate({}).catch(() => null);
        if (auth?.access_token) {
          await createDiscordActivitySession(auth.access_token);
          discordActivityLoginRunning = false;
          await initAccountWidget();
          return true;
        }
      }
      err.stage = "authorize";
      throw err;
    }

    const response = await fetch("/auth/discord/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) {
      const err = new Error(data.error || "Discord Activity token exchange failed.");
      err.stage = "token";
      throw err;
    }

    const auth = await discordSdk.commands.authenticate({ access_token: data.access_token }).catch((err) => {
      err.stage = "authenticate";
      throw err;
    });
    if (!auth) {
      const err = new Error("Discord Activity authentication was not accepted by the client.");
      err.stage = "authenticate";
      throw err;
    }

    discordActivityLoginRunning = false;
    await initAccountWidget();
    return true;
  } catch (err) {
    console.error("Discord Activity login failed:", err);
    reportClientLog("discord-activity-login-failed", {
      stage: err.stage || "unknown",
      message: err.message || String(err),
    });
    discordActivityLoginRunning = false;
    if (showFailure) {
      setAuthGate("Discord Activity login failed. Try again.", true);
      $("btnLoginDiscord").classList.remove("hidden");
      showToast("Discord Activity login failed.");
    }
    return false;
  }
}

async function loginWithDiscord() {
  const activityHint = isDiscordActivityEnvironment();
  const activityLoginSucceeded = await loginWithDiscordActivity({
    automatic: false,
    showFailure: activityHint,
  });
  if (activityLoginSucceeded || activityHint) return;
  window.location.href = "/auth/discord";
}

function enterMainMenu() {
  if (!accountState?.loggedIn) return;
  markEnterGateSeen();
  window.ArcaneAudio?.unlock();
  window.ArcaneAudio?.playMusic("mainMenu");
  switchScreen("menu");
  if (pendingInitialRewards.length > 0) {
    queueInitialRewards(pendingInitialRewards);
    pendingInitialRewards = [];
  }
}

function setMenuOptionsOpen(open) {
  const panel = $("menuOptionsPanel");
  const button = $("btnMoreOptions");
  if (!panel || !button) return;
  panel.classList.toggle("hidden", !open);
  button.setAttribute("aria-expanded", open ? "true" : "false");
}

function toggleMenuOptions() {
  setMenuOptionsOpen($("menuOptionsPanel")?.classList.contains("hidden"));
}

function setAudioConfigOpen(open) {
  const panel = $("audioConfigPanel");
  if (!panel) return;
  panel.classList.toggle("hidden", !open);
  if (open) syncAudioConfigControls();
}

function syncVolumeControl(kind) {
  const input = $(`${kind}VolumeInput`);
  const label = $(`${kind}VolumeValue`);
  if (!input || !label || !window.ArcaneAudio) return;
  const percent = Math.round(window.ArcaneAudio.getChannelVolume(kind) * 100);
  input.value = String(percent);
  label.textContent = `${percent}%`;
}

function syncAudioConfigControls() {
  syncVolumeControl("music");
  syncVolumeControl("sfx");
}

function updateVolumeFromInput(kind, value) {
  if (!window.ArcaneAudio) return;
  const volume = window.ArcaneAudio.setChannelVolume(kind, Number(value) / 100);
  const label = $(`${kind}VolumeValue`);
  if (label) label.textContent = `${Math.round(volume * 100)}%`;
}

function inviteDiscordActivity() {
  const inviteUrl = accountState?.discordInviteUrl;
  if (!inviteUrl) {
    showToast("Discord activity invite is not configured yet.");
    return;
  }
  window.open(inviteUrl, "_blank", "noopener,noreferrer");
}

async function loadEnabledExpansions() {
  try {
    const res = await fetch("/expansions/enabled");
    const data = await res.json();
    enabledExpansionIds = new Set((data.expansions || []).map((expansion) => expansion.id));
  } catch (err) {
    enabledExpansionIds = null;
  }
}

function hasSeenEnterGate() {
  try {
    return sessionStorage.getItem(ENTER_GATE_KEY) === "1";
  } catch (err) {
    return false;
  }
}

function markEnterGateSeen() {
  try {
    sessionStorage.setItem(ENTER_GATE_KEY, "1");
  } catch (err) {
    // ignore storage failures; the click gate still works for this visit
  }
}

function setAuthGate(message, canLogin) {
  const status = $("authStatus");
  const loginButton = $("btnAuthLoginDiscord");
  if (status) status.textContent = message;
  if (loginButton) loginButton.classList.toggle("hidden", !canLogin);
}

function queueInitialRewards(rewards) {
  rewards.forEach((reward) => {
    const newCount = (reward.cards || []).filter((card) => card.isNew).length;
    queueCardOpening({
      title: reward.title || "Starter Cards",
      summary: `${newCount} new cards added to your collection.`,
      cards: reward.cards || [],
    });
  });
}

function updateAccountDisplay(user) {
  if (!user) return;
  if (accountState) accountState.user = { ...(accountState.user || {}), ...user };
  $("accountName").textContent = user.username || accountState?.user?.username || "Player";
  $("accountGold").textContent = `${user.gold || 0} gold`;
  if (user.cardCollection) accountState.user.cardCollection = user.cardCollection;
  renderMenuGoldProgress();
}

function updateDailyRewardProgress(economyUpdate) {
  const mode = economyUpdate?.mode;
  if (!mode || !accountState?.user) return;
  const dailyRewards = accountState.user.economy?.dailyRewards || {};
  accountState.user.economy = {
    ...(accountState.user.economy || {}),
    dailyRewards: {
      ...dailyRewards,
      [mode]: {
        earned: economyUpdate.dailyEarned || 0,
        limit: economyUpdate.dailyLimit || dailyRewards[mode]?.limit || 0,
      },
    },
  };
}

function renderMenuGoldProgress() {
  const rewards = accountState?.user?.economy?.dailyRewards || {};
  setModeGoldProgress("singleplayer", rewards.singleplayer, 10);
  setModeGoldProgress("multiplayer", rewards.multiplayer, 50);
}

function setModeGoldProgress(mode, progress, fallbackLimit) {
  const el = $(`${mode}GoldProgress`);
  if (!el) return;
  const earned = Math.max(0, progress?.earned || 0);
  const limit = progress?.limit || fallbackLimit;
  el.textContent = `${earned} / ${limit} gold today`;
  el.classList.toggle("menu-tile-gold-complete", earned >= limit);
}

function requireLoggedInForPlay() {
  if (!accountState) {
    showToast("Checking Discord login...");
    return false;
  }
  if (!accountState.authEnabled) {
    showToast("Discord login must be configured on the server before playing.");
    return false;
  }
  if (!accountState.loggedIn) {
    showToast("Login with Discord to play.");
    $("accountWidget").classList.remove("hidden");
    $("btnLoginDiscord").classList.remove("hidden");
    return false;
  }
  return true;
}

$("btnLoginDiscord").addEventListener("click", loginWithDiscord);

$("btnAuthLoginDiscord").addEventListener("click", loginWithDiscord);

$("btnMoreOptions").addEventListener("click", (event) => {
  event.stopPropagation();
  toggleMenuOptions();
});

$("btnInviteDiscordActivity").addEventListener("click", inviteDiscordActivity);

$("btnOpenAudioConfig").addEventListener("click", () => {
  setMenuOptionsOpen(false);
  setAudioConfigOpen(true);
});

$("btnCloseAudioConfig").addEventListener("click", () => setAudioConfigOpen(false));
$("musicVolumeInput").addEventListener("input", (event) => updateVolumeFromInput("music", event.target.value));
$("sfxVolumeInput").addEventListener("input", (event) => updateVolumeFromInput("sfx", event.target.value));

document.addEventListener("click", (event) => {
  if (!closestElement(event.target, ".menu-options")) setMenuOptionsOpen(false);
});

$("screen-enter").addEventListener("click", enterMainMenu);
$("screen-enter").addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") enterMainMenu();
});

$("btnLogout").addEventListener("click", async () => {
  try {
    await fetch("/auth/logout", { method: "POST" });
  } catch (err) {
    // ignore — worst case the cookie just expires on its own later
  }
  window.location.reload();
});

prewarmDiscordActivitySdk();
initAccountWidget();

// Hide the initial loading screen once everything is loaded
window.addEventListener("load", () => {
  setTimeout(() => {
    const loading = $("loadingScreen");
    if (loading) loading.classList.add("hidden");
  }, 500);
});

// ---------------- 3D CARD PARALLAX EFFECT ----------------
// Tilts the card and moves its inner art on mouse move for a 3D hologram look.

// Track mouse entry to animate the initial tilt smoothly instead of snapping
document.addEventListener("mouseenter", (e) => {
  if (!canUseHoverTooltips()) return;
  const card = closestElement(e.target, ".minion-card, .hand-card");
  if (!card) return;

  // Skip cards that are dying or locked
  if (card.classList.contains("dying") || card.classList.contains("inventory-card-locked")) return;

  card.dataset.entering = "true";
  
  // Set smooth transition on enter
  card.style.transition = "transform 0.28s cubic-bezier(0.215, 0.61, 0.355, 1), box-shadow 0.15s ease";
  const art = card.querySelector(".card-art");
  if (art) {
    art.style.transition = "transform 0.28s cubic-bezier(0.215, 0.61, 0.355, 1)";
  }

  // Clear entering flag after transition duration
  setTimeout(() => {
    if (card.dataset.entering === "true") {
      delete card.dataset.entering;
    }
  }, 280);
}, true); // Use capture phase since mouseenter does not bubble

document.addEventListener("mousemove", (e) => {
  if (!canUseHoverTooltips()) return;
  const card = closestElement(e.target, ".minion-card, .hand-card");
  if (!card) return;

  // Skip cards that are dying or locked
  if (card.classList.contains("dying") || card.classList.contains("inventory-card-locked")) return;

  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // Max rotation angle (degrees)
  const maxRotate = 16;
  
  // Consistent tilt: card face tilts TOWARDS the cursor
  const rotateX = ((y - centerY) / centerY) * maxRotate;
  const rotateY = ((centerX - x) / centerX) * maxRotate;

  // If we just entered, keep the smooth transition. Otherwise, update fast for real-time tracking
  if (card.dataset.entering !== "true") {
    card.style.transition = "transform 0.08s ease-out, box-shadow 0.15s ease";
  }
  
  // Hand card vs Board minion card adjustments (keep their selected state translate offset)
  let baseTranslateY = "0px";
  if (card.classList.contains("hand-card")) {
    if (card.classList.contains("selected")) {
      baseTranslateY = "-18px";
    } else {
      baseTranslateY = "-12px"; // Match CSS hover lift
    }
  } else if (card.classList.contains("minion-card")) {
    if (card.classList.contains("selected")) {
      baseTranslateY = "-5px";
    } else {
      baseTranslateY = "-5px"; // Match CSS hover lift
    }
  }

  card.style.transform = `translateY(${baseTranslateY}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  card.style.zIndex = "10";

  // Keep the art at native scale so hover inspection does not blur or crop it.
  // Depth now comes from card tilt, shine, and foil instead of zooming the image.
  const art = card.querySelector(".card-art");
  if (art) {
    if (card.dataset.entering !== "true") {
      art.style.transition = "transform 0.08s ease-out";
    }
    art.style.transform = "translateZ(4px)";
  }

  // Update glossy reflection / shine position
  const shineX = (x / rect.width) * 100;
  const shineY = (y / rect.height) * 100;
  card.style.setProperty("--shine-x", `${shineX}%`);
  card.style.setProperty("--shine-y", `${shineY}%`);
  card.style.setProperty("--shine-opacity", "1");

  // Update holographic foil for legendary and mythic cards
  const isHolo = card.classList.contains("rarity-legendary") || card.classList.contains("rarity-mythic");
  if (isHolo) {
    // Angle is derived from the cursor position across the card diagonally
    const foilAngle = 90 + ((x / rect.width) - 0.5) * 80 + ((y / rect.height) - 0.5) * 40;
    card.style.setProperty("--foil-angle", `${foilAngle}deg`);
    card.style.setProperty("--foil-opacity", "0.8");
  }
});

document.addEventListener("mouseout", (e) => {
  if (!canUseHoverTooltips()) return;
  const card = closestElement(e.target, ".minion-card, .hand-card");
  if (!card) return;

  // If moving out of the card (not to a child node)
  if (!e.relatedTarget || !card.contains(e.relatedTarget)) {
    delete card.dataset.entering;
    card.style.transition = "";
    card.style.transform = "";
    card.style.zIndex = "";
    card.style.setProperty("--shine-opacity", "0");
    card.style.setProperty("--foil-opacity", "0.25"); /* Back to subtle resting state */

    const art = card.querySelector(".card-art");
    if (art) {
      art.style.transition = "";
      art.style.transform = "";
    }
  }
});
