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
const STATUS_LABEL = {
  weakened: "W",
  frozen: "F",
  silenced: "X",
  poisoned: "P",
  marked: "!",
};
const STATUS_FULL_LABEL = {
  weakened: "Weakened",
  frozen: "Frozen",
  silenced: "Silenced",
  poisoned: "Poisoned",
  marked: "Marked",
};
const RARITY_LABEL = { common: "Common", rare: "Rare", legendary: "Legendary", mythic: "Mythic" };
const DISCORD_CLIENT_ID = "1523179359106502716";
const CHANGELOG_VERSION = "1.5.2";
const CHANGELOG_SEEN_STORAGE_KEY = "arcane_changelog_seen_version";
const ACTIVITY_AUTH_CACHE_KEY = "arcane_activity_auth";
const TYPE_ICON = { minion: "⚔", spell: "✦" };

let ws = null;
let wsConnectPromise = null;
let myState = null;          // last state received (server or local engine)
let selectedHandIndex = null; // index of the hand card selected to play
let selectedAttackerId = null; // instanceId of the minion selected to attack

let isLocalMode = false;     // true = "vs NPC" mode, no network
let localGame = null;        // TCGEngine.Game instance running in the browser
let accountState = null;
let lastEconomyUpdate = null;
let activeCampaignStage = null;
let pendingInitialRewards = [];
const ENTER_GATE_KEY = "arcane_enter_gate_seen";
const ACTIVE_MULTIPLAYER_MATCH_KEY = "arcane_active_multiplayer_match";
const RECONNECT_RETRY_MS = 3_000;
const RECONNECT_WINDOW_MS = 60_000;
const DISCORD_ACTIVITY_READY_TIMEOUT_MS = 12000;
const SPELL_REVEAL_MS = 800;
const TOUCH_TOOLTIP_HOLD_MS = 500;
const TOUCH_TOOLTIP_MOVE_TOLERANCE = 10;
let quickplaySearching = false;
let enabledExpansionIds = null;
let activeMatchMode = null;
let matchIntroTimer = null;
let matchIntroRoomCode = null;
let discordActivityLoginRunning = false;
let discordActivitySdkPromise = null;
let discordActivityReadyPromise = null;
let discordActivityEvents = null;
let discordActivityLayoutSubscriptionPromise = null;
let reconnectingMultiplayer = false;
let reconnectDeadline = 0;
let reconnectTimer = null;
let resumeAckTimer = null;
let matchStatusTimer = null;

let lastAnimatedActionSeq = 0; // avoids replaying the same attack's animation
let lastRoundBannerKey = null;
let stateQueue = [];
let isApplyingStateQueue = false;
let stateQueueGeneration = 0;
let roundBannerMode = null;
let pendingHandPlayAnimation = null;
const predictedAttackKeys = new Set();
let turnClockOffsetMs = 0;
let turnTimerInterval = null;
let lastHandTurnKey = null;
const SETTLE_DELAY = 460;      // ms we wait after an impact before "settling" the final state
const ROUND_BANNER_DELAY = 980;
const ALLOWED_EMOTES = new Set(["😄", "😭", "😯", "😡", "🫄", "💀"]);

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const apiFetch = (input, options = {}) => {
  const headers = new Headers(options.headers || {});
  const sessionToken = readActivitySessionToken();
  if (sessionToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${sessionToken}`);
  }
  return fetch(input, { ...options, headers, credentials: "include" });
};
window.arcaneFetch = apiFetch;
const closestElement = (target, selector) =>
  target && target.nodeType === Node.ELEMENT_NODE ? target.closest(selector) : null;
const hoverTooltipQuery = window.matchMedia?.("(hover: hover) and (pointer: fine)");

function canUseHoverTooltips() {
  return hoverTooltipQuery ? hoverTooltipQuery.matches : true;
}

async function requestWebSocketTicket() {
  const res = await apiFetch("/auth/ws-ticket", { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.ticket !== "string") {
    throw new Error(data.error || "Could not secure the game connection.");
  }
  return data.ticket;
}

function connect(onOpen) {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    if (onOpen) {
      if (ws.readyState === WebSocket.OPEN) onOpen();
      else ws.addEventListener("open", onOpen, { once: true });
    }
    return Promise.resolve(ws);
  }
  if (wsConnectPromise) {
    if (onOpen) wsConnectPromise.then(onOpen).catch(() => {});
    return wsConnectPromise;
  }

  const connection = (async () => {
    const ticket = await requestWebSocketTicket();
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${location.host}?ticket=${encodeURIComponent(ticket)}`);
    ws = socket;

    socket.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      handleServerMessage(msg);
    });
    socket.addEventListener("close", () => {
      if (ws === socket) ws = null;
      if (shouldReconnectMultiplayer()) {
        showToast("Connection lost. Reconnecting to your match...");
        beginMultiplayerReconnect();
        return;
      }
      if (!isLocalMode) showToast("Lost connection to the server.");
    });
    socket.addEventListener("error", () => {
      if (!isLocalMode && !reconnectingMultiplayer) showToast("Couldn't connect to the online server. Is it running?");
    });

    return new Promise((resolve, reject) => {
      socket.addEventListener("open", () => resolve(socket), { once: true });
      socket.addEventListener("error", () => reject(new Error("Could not open the game connection.")), { once: true });
    });
  })();

  wsConnectPromise = connection;
  if (onOpen) connection.then(onOpen).catch((err) => showToast(err.message || "Could not connect to the server."));
  connection.finally(() => {
    if (wsConnectPromise === connection) wsConnectPromise = null;
  }).catch(() => {});
  return connection;
}

function hasStoredMultiplayerMatch() {
  try {
    return sessionStorage.getItem(ACTIVE_MULTIPLAYER_MATCH_KEY) === "1";
  } catch (err) {
    return false;
  }
}

function rememberMultiplayerMatch() {
  try {
    sessionStorage.setItem(ACTIVE_MULTIPLAYER_MATCH_KEY, "1");
  } catch (err) {
    // Reconnection still works in the current page if storage is unavailable.
  }
}

function forgetMultiplayerMatch() {
  try {
    sessionStorage.removeItem(ACTIVE_MULTIPLAYER_MATCH_KEY);
  } catch (err) {
    // Ignore storage failures.
  }
}

function shouldReconnectMultiplayer() {
  return !isLocalMode && activeMatchMode === "multiplayer" && hasStoredMultiplayerMatch();
}

function clearMultiplayerReconnect() {
  reconnectingMultiplayer = false;
  reconnectDeadline = 0;
  clearTimeout(reconnectTimer);
  clearTimeout(resumeAckTimer);
  reconnectTimer = null;
  resumeAckTimer = null;
}

function clearMatchStatus() {
  clearInterval(matchStatusTimer);
  matchStatusTimer = null;
  $("matchStatus")?.classList.add("hidden");
}

function setMatchStatus(message, { warning = false } = {}) {
  const status = $("matchStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("warning", warning);
  status.classList.remove("hidden");
}

function showOpponentDisconnectStatus(payload = {}) {
  clearInterval(matchStatusTimer);
  const deadline = Number(payload.reconnectDeadline);
  const isTournament = payload.isTournament === true;
  const update = () => {
    const seconds = Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : null;
    const suffix = seconds == null ? "" : ` ${seconds}s`;
    setMatchStatus(isTournament ? `Tournament opponent disconnected. Forfeit in${suffix}.` : `Opponent disconnected. Reconnect window:${suffix}`, { warning: true });
    if (seconds === 0) {
      clearInterval(matchStatusTimer);
      matchStatusTimer = null;
    }
  };
  update();
  if (Number.isFinite(deadline)) matchStatusTimer = setInterval(update, 250);
}

function beginMultiplayerReconnect() {
  if (!shouldReconnectMultiplayer()) return;
  reconnectingMultiplayer = true;
  if (!reconnectDeadline) reconnectDeadline = Date.now() + RECONNECT_WINDOW_MS;
  scheduleMultiplayerReconnect(0);
}

function scheduleMultiplayerReconnect(delay) {
  if (reconnectTimer || !reconnectingMultiplayer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (Date.now() >= reconnectDeadline) {
      clearMultiplayerReconnect();
      forgetMultiplayerMatch();
      showToast("Your match could not be restored.");
      returnToMenuFromMatch();
      return;
    }
    connect(() => {
      if (!reconnectingMultiplayer) return;
      send("resumeMatch", {});
      const reconnectSocket = ws;
      resumeAckTimer = setTimeout(() => {
        if (reconnectingMultiplayer && ws === reconnectSocket && reconnectSocket?.readyState === WebSocket.OPEN) reconnectSocket.close();
      }, 5_000);
    });
  }, delay);
}

function resumeSavedMultiplayerMatch() {
  if (!hasStoredMultiplayerMatch()) return;
  activeMatchMode = "multiplayer";
  beginMultiplayerReconnect();
}

function send(type, payload = {}) {
  if (isLocalMode) {
    void handleLocalAction(type, payload);
    return;
  }
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

// ---------------- LOCAL MODE (VS NPC) ----------------

function startLocalMatch(playerName) {
  clearMultiplayerReconnect();
  forgetMultiplayerMatch();
  isLocalMode = true;
  activeMatchMode = "singleplayer";
  myState = null;
  lastAnimatedActionSeq = 0;
  lastRoundBannerKey = null;
  resetStateQueue();
  resetMatchIntro();
  localGame = new TCGEngine.Game("LOCAL", playerName || "You", "NPC");
  switchScreen("game");
  refreshLocalState();
}

function startServerSingleplayer() {
  clearMultiplayerReconnect();
  forgetMultiplayerMatch();
  isLocalMode = false;
  activeMatchMode = "singleplayer";
  myState = null;
  lastAnimatedActionSeq = 0;
  lastRoundBannerKey = null;
  resetStateQueue();
  lastEconomyUpdate = null;
  connect(() => send("startSingleplayer", {}));
}

async function handleLocalAction(type, payload) {
  try {
    if (type === "emote") {
      showEmote(payload?.emote, true);
      return;
    } else if (type === "playCard") {
      const card = localGame.getStateFor(0).me.hand[payload.handIndex];
      if (card?.type === "spell") await showSpellCastReveal(card.id);
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
  lastHandTurnKey = null;
}

function applyIncomingState(newState) {
  showMatchIntro(newState);
  stateQueue.push(newState);
  processStateQueue();
}

function resetMatchIntro() {
  clearTimeout(matchIntroTimer);
  matchIntroTimer = null;
  matchIntroRoomCode = null;
  $("matchIntro")?.classList.add("hidden");
  $("matchIntro")?.classList.remove("is-leaving");
}

function introInitials(name) {
  const parts = String(name || "Player").trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : (parts[0] || "P").slice(0, 2)).toUpperCase();
}

function introProfile(participant, own) {
  const account = own ? accountState?.user : null;
  const profile = participant?.profile || account || {};
  const selected = profile.selectedTitle;
  const progress = typeof selected === "string"
    ? window.ArcaneProfileCatalog?.getProgress(profile.stats, selected, profile.equippedBadgeIds, {
      supporter: profile.supporter === true,
      cardCollection: profile.cardCollection,
      unlockedCards: profile.unlockedCards,
    })
    : null;
  return {
    username: profile.username || participant?.name || "Player",
    avatarUrl: profile.avatarUrl || participant?.avatarUrl || null,
    title: selected?.name || progress?.selectedTitle?.name || "Arcane Initiate",
    badges: profile.equippedBadges || progress?.equippedBadges || [],
  };
}

function renderIntroContender(element, profile) {
  if (!element) return;
  const avatar = document.createElement("span");
  avatar.className = "match-intro-avatar";
  avatar.textContent = introInitials(profile.username);
  if (profile.avatarUrl) {
    const image = document.createElement("img");
    image.src = profile.avatarUrl;
    image.alt = "";
    image.onerror = () => image.remove();
    avatar.append(image);
  }
  const copy = document.createElement("div");
  copy.className = "match-intro-copy";
  const name = document.createElement("div");
  name.className = "match-intro-name";
  name.textContent = profile.username;
  const title = document.createElement("div");
  title.className = "match-intro-title";
  title.textContent = profile.title;
  const badges = document.createElement("div");
  badges.className = "match-intro-badges";
  (profile.badges || []).slice(0, 3).forEach((badge) => {
    const badgeElement = document.createElement("span");
    badgeElement.className = "match-intro-badge";
    badgeElement.title = badge.name || "Achievement badge";
    badgeElement.innerHTML = window.ArcaneProfileBadges?.badgeMarkup(badge.id, true) || "";
    badges.append(badgeElement);
  });
  copy.append(name, title, badges);
  element.replaceChildren(avatar, copy);
}

function showMatchIntro(state) {
  if (!state?.roomCode || matchIntroRoomCode === state.roomCode) return;
  matchIntroRoomCode = state.roomCode;
  const intro = $("matchIntro");
  if (!intro) return;
  renderIntroContender($("matchIntroOpponent"), introProfile(state.opponent, false));
  renderIntroContender($("matchIntroSelf"), introProfile(state.me, true));
  intro.classList.remove("hidden", "is-leaving");
  clearTimeout(matchIntroTimer);
  const durationMs = Math.max(700, Number(state.matchIntroRemainingMs) || 4200);
  const fadeOutMs = 420;
  matchIntroTimer = setTimeout(() => {
    intro.classList.add("is-leaving");
    matchIntroTimer = setTimeout(() => intro.classList.add("hidden"), fadeOutMs);
  }, Math.max(0, durationMs - fadeOutMs));
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
  const roundKey = String(newState.turnNumber);
  const isRoundChange = prev && prev.turnNumber !== newState.turnNumber && roundKey !== lastRoundBannerKey;
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
    case "tournamentMatchQueued":
      showToast("Waiting for your tournament opponent to enter the match.");
      break;
    case "tournamentUpdated":
      void window.ArcaneTournaments?.load();
      break;
    case "tournamentPrize":
      updateAccountDisplay({ ...(accountState?.user || {}), gold: msg.payload?.balance, stats: msg.payload?.stats || accountState?.user?.stats || {} });
      showToast(`Tournament ${msg.payload?.place || "prize"}: +${msg.payload?.gold || 0} gold`);
      break;
    case "matchStarted":
      setQuickplaySearching(false);
      activeMatchMode = activeMatchMode || "multiplayer";
      if (activeMatchMode === "multiplayer") rememberMultiplayerMatch();
      else forgetMultiplayerMatch();
      myState = null;
      lastAnimatedActionSeq = 0;
      lastRoundBannerKey = null;
      resetStateQueue();
      resetMatchIntro();
      switchScreen("game");
      break;
    case "matchResumed":
      clearMultiplayerReconnect();
      activeMatchMode = "multiplayer";
      rememberMultiplayerMatch();
      switchScreen("game");
      showToast("Match reconnected.");
      break;
    case "state":
      applyIncomingState(msg.payload);
      break;
    case "spellCast":
      void showSpellCastReveal(msg.payload?.cardId);
      break;
    case "mythicSummon":
      void showMythicSummonReveal(msg.payload?.cardId);
      break;
    case "emote":
      showEmote(msg.payload?.emote, Boolean(msg.payload?.isSelf));
      break;
    case "economyUpdate":
      lastEconomyUpdate = msg.payload;
      updateDailyRewardProgress(msg.payload);
      updateAccountDisplay({ ...(accountState?.user || {}), ...msg.payload });
      if (myState?.winner !== null) updateEndRewardText();
      break;
    case "campaignReward": {
      updateAccountDisplay({
        ...(accountState?.user || {}),
        cardCollection: msg.payload?.cardCollection || {},
        unlockedCards: msg.payload?.unlockedCards || [],
        stats: msg.payload?.stats || accountState?.user?.stats || {},
        modeStats: msg.payload?.modeStats || accountState?.user?.modeStats || {},
      });
      const cards = msg.payload?.cards || [];
      if (activeCampaignStage) activeCampaignStage.cardDrops = msg.payload?.cardDrops || activeCampaignStage.cardDrops;
      queueCardOpening({ title: "The Gates reward", summary: `${cards.length} random card revealed from The Gates.`, cards });
      break;
    }
    case "profileStatsUpdate":
      updateAccountDisplay({
        ...(accountState?.user || {}),
        stats: msg.payload?.stats || accountState?.user?.stats || {},
        modeStats: msg.payload?.modeStats || accountState?.user?.modeStats || {},
      });
      break;
    case "opponentDisconnected":
      showOpponentDisconnectStatus(msg.payload);
      showToast(msg.payload?.isTournament ? "Opponent disconnected. Tournament forfeit begins in 30 seconds." : "Your opponent disconnected. Waiting for them to reconnect.");
      break;
    case "opponentReconnected":
      clearMatchStatus();
      if (myState?.tournament) setMatchStatus("Tournament match · 30 seconds per turn");
      showToast("Your opponent reconnected.");
      break;
    case "tournamentForfeitWin":
      clearInterval(matchStatusTimer);
      matchStatusTimer = null;
      setMatchStatus("Opponent did not return. Tournament victory by forfeit.");
      showToast("Your opponent did not return. You win this tournament match by forfeit.");
      break;
    case "matchCancelled":
      clearMatchStatus();
      clearMultiplayerReconnect();
      forgetMultiplayerMatch();
      myState = null;
      resetStateQueue();
      showToast(msg.payload?.message || "Match cancelled.");
      returnToMenuFromMatch();
      break;
    case "disconnectPenalty":
      updateAccountDisplay({ ...(accountState?.user || {}), gold: msg.payload.gold });
      showToast(`Disconnect penalty: -${msg.payload.penaltyGold} gold.`);
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
  el.classList.remove("damage-impact");
  void el.offsetWidth;
  el.classList.add("damage-impact");
  setTimeout(() => el.classList.remove("damage-impact"), 650);
  return true;
}

function flashSelfHeroScreen() {
  const screen = $("screen-game");
  if (!screen) return;
  screen.classList.remove("hero-damage-screen");
  void screen.offsetWidth;
  screen.classList.add("hero-damage-screen");
  setTimeout(() => screen.classList.remove("hero-damage-screen"), 420);
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
    const flashed = flashDamage(panelEl);
    if (panelEl === $("selfHero")) flashSelfHeroScreen();
    return flashed;
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
  const attackerIsSelf = prev.me.board.some((m) => m.instanceId === action.attackerInstanceId);
  const targetEl = action.targetInstanceId
    ? findCardElement(action.targetInstanceId)
    : attackerIsSelf
      ? $("oppHero")
      : $("selfHero");
  const key = attackPredictionKey(action.attackerInstanceId, action.targetInstanceId || "face");
  if (predictedAttackKeys.delete(key)) return false;
  return animateAttackLungeElements(attackerEl, targetEl, attackerIsSelf);
}

function attackPredictionKey(attackerInstanceId, targetInstanceId) {
  return `${attackerInstanceId}:${targetInstanceId || "face"}`;
}

function animateAttackLungeElements(attackerEl, targetEl, attackerIsSelf) {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion || !attackerEl?.animate) return false;
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

function predictAttack(attackerInstanceId, targetInstanceId) {
  const attackerEl = findCardElement(attackerInstanceId);
  if (!attackerEl) return;
  const targetEl = targetInstanceId && targetInstanceId !== "face"
    ? findCardElement(targetInstanceId)
    : $("oppHero");
  const key = attackPredictionKey(attackerInstanceId, targetInstanceId);
  predictedAttackKeys.add(key);
  animateAttackLungeElements(attackerEl, targetEl, true);
  setTimeout(() => predictedAttackKeys.delete(key), 1_500);
}

function predictCardPlay(cardEl) {
  if (!cardEl) return;
  cardEl.classList.add("action-pending");
  setTimeout(() => cardEl.classList.remove("action-pending"), 1_500);
}

function showSpellCastReveal(cardId) {
  const card = TCGCards.getCardById(cardId);
  if (!card || card.type !== "spell") return Promise.resolve();

  document.querySelector(".spell-cast-reveal")?.remove();
  const reveal = document.createElement("div");
  reveal.className = "spell-cast-reveal";
  reveal.setAttribute("aria-hidden", "true");
  reveal.innerHTML = `
    <div class="minion-card spell-cast-card ${rarityClass(card)}">
      ${cardArtHTML(card)}
      ${cardCostHTML(card)}
    <div class="card-footer"><span class="card-name">${escapeHtml(card.name)}</span>${spellEffectValueHTML(card)}</div>
    </div>
  `;
  document.body.append(reveal);
  requestAnimationFrame(() => reveal.classList.add("is-visible"));
  window.ArcaneAudio?.playSfx("cardPlay");

  return sleep(SPELL_REVEAL_MS).then(() => reveal.remove());
}

function showMythicSummonReveal(cardId) {
  const card = TCGCards.getCardById(cardId);
  if (!card || card.type !== "minion" || card.rarity !== "mythic") return Promise.resolve();

  document.querySelector(".spell-cast-reveal")?.remove();
  const reveal = document.createElement("div");
  reveal.className = "spell-cast-reveal mythic-summon-reveal";
  reveal.setAttribute("aria-hidden", "true");
  reveal.innerHTML = `
    <div class="minion-card spell-cast-card mythic-summon-card ${rarityClass(card)}">
      ${boardCardMarkup(card)}
    </div>
  `;
  document.body.append(reveal);
  requestAnimationFrame(() => reveal.classList.add("is-visible"));
  window.ArcaneAudio?.playSfx("cardPlay");

  return sleep(SPELL_REVEAL_MS).then(() => reveal.remove());
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
  const screenIds = ["auth", "enter", "menu", "lobby", "inventory", "shop", "trade", "profile", "game"];
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

async function loadOnlinePlayerCount() {
  const count = $("onlinePlayerCount");
  if (!count) return;

  count.textContent = "5 players online";
  count.classList.remove("hidden");
  try {
    const res = await apiFetch("/players/online");
    const data = await res.json();
    if (!res.ok) return;
    const online = Math.max(5, Number(data.online) || 0);
    count.textContent = `${online} player${online === 1 ? "" : "s"} online`;
  } catch {
    // The fixed minimum remains visible if the availability request fails.
  }
}

function closeEmotePanel() {
  $("emotePanel")?.classList.add("hidden");
  $("btnEmotes")?.setAttribute("aria-expanded", "false");
}

function showEmote(emote, isSelf) {
  if (!ALLOWED_EMOTES.has(emote)) return;
  const hero = $(isSelf ? "selfHero" : "oppHero");
  if (!hero) return;

  let bubble = hero.querySelector(".emote-bubble");
  if (!bubble) {
    bubble = document.createElement("span");
    bubble.className = "emote-bubble";
    hero.appendChild(bubble);
  }
  bubble.textContent = emote;
  bubble.classList.toggle("emote-bubble-opponent", !isSelf);
  bubble.classList.remove("emote-bubble-show");
  void bubble.offsetWidth;
  bubble.classList.add("emote-bubble-show");
  clearTimeout(hero._emoteTimer);
  hero._emoteTimer = setTimeout(() => bubble.remove(), 2600);
}

function openLobby(mode) {
  if (!requireLoggedInForPlay()) return;
  $("screen-lobby").classList.toggle("lobby-singleplayer", mode === "singleplayer");
  $("singleplayerSnow").classList.toggle("hidden", mode !== "singleplayer");
  $("singleplayerActions").classList.toggle("hidden", mode !== "singleplayer");
  $("multiplayerActions").classList.toggle("hidden", mode !== "multiplayer");
  $("lobbySubtitle").textContent =
    mode === "singleplayer"
      ? "Practice against the NPC or play a Campaign for rewards"
      : "Online 1v1 — create a room or join one with a code";
  $("roomInfo").classList.add("hidden");
  $("lobbyError").classList.add("hidden");
  $("onlinePlayerCount").classList.toggle("hidden", mode !== "multiplayer");
  if (mode === "multiplayer") {
    $("lobbySubtitle").textContent = "Online 1v1 - find a match or use a room code";
    setLobbyTab("quickplay");
    loadOnlinePlayerCount();
    void window.ArcaneTournaments?.load();
  }
  switchScreen("lobby");
}

$("tileSingleplayer").addEventListener("click", () => {
  openLobby("singleplayer");
});
$("tileMultiplayer").addEventListener("click", () => openLobby("multiplayer"));
$("tileSupport").addEventListener("click", () => window.open("https://ko-fi.com/apparat", "_blank", "noopener,noreferrer"));

document.querySelectorAll(".menu-tile-locked").forEach((tile) => {
  tile.addEventListener("click", () => {
    showToast(`${tile.dataset.lockedName} isn't available yet — coming soon.`);
  });
});

$("btnBackToMenu").addEventListener("click", () => {
  setQuickplaySearching(false);
  send("cancelQuickplay", {});
  send("cancelTournamentMatch", {});
  switchScreen("menu");
});

// ---------------- LOBBY ----------------

function setLobbyTab(tab) {
  const isQuickplay = tab === "quickplay";
  const isRoomCode = tab === "room";
  const isRanking = tab === "ranking";
  const isTournaments = tab === "tournaments";
  $("tabRoomCode").classList.toggle("active", isRoomCode);
  $("tabQuickplay").classList.toggle("active", isQuickplay);
  $("tabRanking").classList.toggle("active", isRanking);
  $("tabTournaments").classList.toggle("active", isTournaments);
  $("roomCodePanel").classList.toggle("hidden", !isRoomCode);
  $("quickplayPanel").classList.toggle("hidden", !isQuickplay);
  $("rankingPanel").classList.toggle("hidden", !isRanking);
  $("tournamentPanel").classList.toggle("hidden", !isTournaments);
  $("roomInfo").classList.add("hidden");
  if (isTournaments) void window.ArcaneTournaments?.load();
}

function rankingRowHTML(player) {
  const rank = Number(player?.rank) || 0;
  const wins = Number(player?.wins) || 0;
  const name = escapeHtml(player?.username || "Player");
  const avatar = player?.avatarUrl
    ? `<img class="ranking-avatar" src="${escapeHtmlAttr(player.avatarUrl)}" alt="" />`
    : `<span class="ranking-avatar ranking-avatar-empty" aria-hidden="true"></span>`;
  return `<li class="ranking-row"><span class="ranking-rank">#${rank}</span><span class="ranking-player">${avatar}<span class="ranking-name">${name}</span></span><span class="ranking-wins">${wins}</span></li>`;
}

async function loadQuickplayRanking() {
  const list = $("rankingList");
  const current = $("rankingCurrentPlayer");
  if (!list || !current) return;
  list.innerHTML = '<li class="ranking-empty">Loading ranking...</li>';
  current.classList.add("hidden");

  try {
    const res = await apiFetch("/ranking/quickplay");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load the quickplay ranking.");
    const players = Array.isArray(data.players) ? data.players : [];
    list.innerHTML = players.length > 0
      ? players.map(rankingRowHTML).join("")
      : '<li class="ranking-empty">No quickplay wins yet.</li>';
    if (data.currentPlayer) {
      current.innerHTML = rankingRowHTML(data.currentPlayer);
      current.classList.remove("hidden");
    }
  } catch (err) {
    list.innerHTML = `<li class="ranking-empty">${escapeHtml(err.message || "Could not load the quickplay ranking.")}</li>`;
  }
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
$("tabTournaments").addEventListener("click", () => setLobbyTab("tournaments"));
$("tabRanking").addEventListener("click", () => {
  setLobbyTab("ranking");
  loadQuickplayRanking();
});

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

$("btnStartTheGatesCampaign").addEventListener("click", () => {
  openCampaignStages();
});

async function openCampaignStages() {
  try {
    const res = await arcaneFetch("/campaigns");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load campaigns.");
    activeCampaignStage = (data.campaigns || [])[0] || null;
    if (!activeCampaignStage) throw new Error("No campaign stages are available.");
    $("campaignStageLore").textContent = activeCampaignStage.lore;
    document.querySelector(".singleplayer-mode-grid").classList.add("hidden");
    $("campaignStagePanel").classList.remove("hidden");
  } catch (err) {
    showToast(err.message);
  }
}

$("btnCampaignStagesBack").addEventListener("click", () => {
  $("campaignStagePanel").classList.add("hidden");
  document.querySelector(".singleplayer-mode-grid").classList.remove("hidden");
});

$("btnCampaignInfo").addEventListener("click", () => {
  if (!activeCampaignStage || typeof openExpansionContents !== "function") return;
  openExpansionContents({
    expansionName: activeCampaignStage.name,
    cardIds: activeCampaignStage.rewardCardIds,
    cardDrops: activeCampaignStage.cardDrops,
  });
});

$("btnStartCampaignStage").addEventListener("click", () => {
  if (!activeCampaignStage || !requireLoggedInForPlay()) return;
  clearMultiplayerReconnect();
  forgetMultiplayerMatch();
  isLocalMode = false;
  activeMatchMode = "campaign";
  myState = null;
  lastEconomyUpdate = null;
  resetStateQueue();
  connect(() => send("startCampaign", { campaignId: activeCampaignStage.id }));
});

// ---------------- RENDER ----------------

function render(state) {
  // A full re-render is about to replace every card node, including
  // possibly the one currently under the cursor/finger — hide any open
  // tooltip first, since its mouseleave will never fire on a node that
  // no longer exists.
  hideCardTooltip();
  const gameScreen = $("screen-game");
  if (state.campaignTheme) gameScreen.dataset.campaignTheme = state.campaignTheme;
  else delete gameScreen.dataset.campaignTheme;
  if (state.campaignBoardMusic) window.ArcaneAudio?.playMusic(state.campaignBoardMusic);
  if (state.tournament && state.winner === null && $("matchStatus")?.classList.contains("hidden")) {
    setMatchStatus("Tournament match · 30 seconds per turn");
  }
  if (!state.tournament) clearMatchStatus();

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
  renderTurnTimer(state);

  // Log
  $("gameLog").innerHTML = state.log.map((l) => `<div>${escapeHtml(l)}</div>`).join("");
  $("gameLog").scrollTop = $("gameLog").scrollHeight;

  // Boards
  renderBoard($("oppBoard"), state.opponent.board, false);
  renderBoard($("selfBoard"), state.me.board, true);

  // Own hand
  renderHand(state);
  syncHandVisibility(state);

  // End turn button
  $("btnEndTurn").disabled = !state.isYourTurn;
  $("btnEndTurn").classList.remove("action-pending");

  updateTargetableHighlights(state);
}

function renderTurnTimer(state) {
  const timer = $("turnTimer");
  if (!timer) return;
  clearInterval(turnTimerInterval);
  turnTimerInterval = null;
  turnClockOffsetMs = Number.isFinite(state.serverNow) ? state.serverNow - Date.now() : 0;

  if (!Number.isFinite(state.turnDeadline)) {
    timer.textContent = state.opponent?.name === "NPC" && !state.isYourTurn ? "NPC is thinking" : state.tournament ? "30s per turn" : "40s per turn";
    timer.classList.remove("turn-timer-warning");
    return;
  }

  const durationSeconds = Math.max(1, Math.round((state.turnDurationMs || 40_000) / 1_000));
  const updateTimer = () => {
    const remaining = Math.max(0, Math.ceil((state.turnDeadline - (Date.now() + turnClockOffsetMs)) / 1_000));
    timer.textContent = `${remaining}s / ${durationSeconds}s`;
    timer.classList.toggle("turn-timer-warning", remaining <= 10);
    if (remaining <= 0) {
      clearInterval(turnTimerInterval);
      turnTimerInterval = null;
    }
  };
  updateTimer();
  turnTimerInterval = setInterval(updateTimer, 250);
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
  const existing = new Map(
    [...container.children]
      .filter((element) => element.dataset?.instanceId)
      .map((element) => [element.dataset.instanceId, element])
  );

  board.forEach((minion) => {
    let el = existing.get(minion.instanceId);
    if (!el) {
      el = document.createElement("div");
      el.addEventListener("click", () => onMinionClick(el._minion, el._isSelf));
      attachCardTooltip(el, () => el._minion);
    }
    existing.delete(minion.instanceId);
    updateBoardCard(el, minion, isSelf);
    container.appendChild(el);
  });

  existing.forEach((el) => el.remove());
}

function boardCardMarkup(minion) {
  return `
      ${cardArtHTML(minion)}
      ${cardCostHTML(minion)}
      <div class="card-badges">${keywordBadgesHTML(minion)}${statusBadgesHTML(minion)}</div>
      <div class="card-footer">
        <span class="card-stat atk">${minion.attack}</span>
        <span class="card-name">${escapeHtml(minion.name)}</span>
        <span class="card-stat hp">${minion.health}</span>
      </div>
    `;
}

function boardVisualKey(minion) {
  return [
    minion.cardId,
    minion.name,
    minion.attack,
    minion.health,
    minion.maxHealth,
    minion.cost,
    minion.divineShield ? 1 : 0,
    (minion.keywords || []).join(","),
    JSON.stringify(minion.statuses || []),
  ].join("|");
}

function updateBoardCard(el, minion, isSelf) {
  const classNames = ["minion-card", rarityClass(minion)];
  if ((minion.keywords || []).includes("taunt")) classNames.push("taunt");
  if (minion.divineShield) classNames.push("shield");
  activeStatuses(minion).forEach((status) => classNames.push(`status-${status.type}`));
  if (isSelf && !minion.canAttack) classNames.push("exhausted");
  if (isSelf && minion.instanceId === selectedAttackerId) classNames.push("selected");
  el.className = classNames.join(" ");
  el.dataset.instanceId = minion.instanceId;
  el._minion = minion;
  el._isSelf = isSelf;

  const visualKey = boardVisualKey(minion);
  if (el.dataset.visualKey !== visualKey) {
    el.dataset.visualKey = visualKey;
    el.innerHTML = boardCardMarkup(minion);
  }
}

function renderHand(state) {
  const container = $("handArea");
  container.innerHTML = "";
  const handCount = state.me.hand.length;
  container.dataset.cardCount = String(handCount);
  state.me.hand.forEach((card, idx) => {
    const el = document.createElement("div");
    el.className = `hand-card ${rarityClass(card)}`;
    const fanOffset = idx - (handCount - 1) / 2;
    el.style.setProperty("--hand-angle", `${fanOffset * 3.2}deg`);
    // Lift the outer cards slightly so their rotation never reaches the
    // lower board frame.
    el.style.setProperty("--hand-rest-y", `${-Math.abs(fanOffset) * 5}px`);
    if (card.type === "spell") el.classList.add("spell");
    if (card.cost > state.me.manaCurrent) el.classList.add("unaffordable");
    if (idx === selectedHandIndex) el.classList.add("selected");
    el.dataset.handIndex = String(idx);

    el.innerHTML = `
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

  // Targeted spells remain in hand until a target is chosen. Clicking the
  // selected card again is the quickest, touch-friendly way to cancel it.
  if (selectedHandIndex === idx) {
    clearSelection();
    render(state);
    return;
  }

  const needsEnemyMinionTarget = cardRequiresEnemyMinionTarget(card);

  // Minions normally enter the board immediately. A minion with an on-play
  // status effect waits for an enemy target before the server accepts it.
  if (card.type === "minion" && !needsEnemyMinionTarget) {
    selectedHandIndex = null;
    pendingHandPlayAnimation = cardEl
      ? { cardId: card.id, rect: cardEl.getBoundingClientRect(), createdAt: performance.now() }
      : null;
    predictCardPlay(cardEl);
    window.ArcaneAudio?.playSfx("cardPlay");
    send("playCard", { handIndex: idx, targetInstanceId: null });
    return;
  }

  // Draw spell, or a spell that works purely off "abilities" (no
  // classic effect): neither one needs you to pick a target.
  if ((card.effect === "draw" || !card.effect) && !needsEnemyMinionTarget) {
    selectedHandIndex = null;
    predictCardPlay(cardEl);
    window.ArcaneAudio?.playSfx("cardPlay");
    send("playCard", { handIndex: idx, targetInstanceId: null });
    return;
  }

  // Damage/heal spells and status cards: ask for a target.
  selectedHandIndex = idx;
  showTargetHint(needsEnemyMinionTarget
    ? "Choose an enemy minion"
    : card.effect === "heal"
      ? "Choose who to heal (or your own hero)"
      : "Choose a target (or the enemy hero)");
  render(myState);
}

function onMinionClick(minion, isSelf) {
  const state = myState;
  if (!state.isYourTurn) return showToast("It's not your turn.");

  // Case 1: I have a spell selected, waiting for a target
  if (selectedHandIndex !== null) {
    const selectedCard = state.me.hand[selectedHandIndex];
    if (cardRequiresEnemyMinionTarget(selectedCard) && isSelf) {
      return showToast("Choose an enemy minion.");
    }
    predictCardPlay(document.querySelector(`.hand-card[data-hand-index="${selectedHandIndex}"]`));
    window.ArcaneAudio?.playSfx("cardPlay");
    send("playCard", { handIndex: selectedHandIndex, targetInstanceId: minion.instanceId });
    selectedHandIndex = null;
    hideTargetHint();
    return;
  }

  // Case 2: I have an attacker selected and I click an enemy minion
  if (selectedAttackerId && !isSelf) {
    window.ArcaneAudio?.playSfx("attack");
    predictAttack(selectedAttackerId, minion.instanceId);
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
    const selectedCard = state.me.hand[selectedHandIndex];
    if (cardRequiresEnemyMinionTarget(selectedCard)) {
      return showToast("Choose an enemy minion.");
    }
    const target = isSelf ? "faceSelf" : "faceEnemy";
    predictCardPlay(document.querySelector(`.hand-card[data-hand-index="${selectedHandIndex}"]`));
    window.ArcaneAudio?.playSfx("cardPlay");
    send("playCard", { handIndex: selectedHandIndex, targetInstanceId: target });
    selectedHandIndex = null;
    hideTargetHint();
    return;
  }

  if (selectedAttackerId && !isSelf) {
    window.ArcaneAudio?.playSfx("attack");
    predictAttack(selectedAttackerId, "face");
    send("attack", { attackerInstanceId: selectedAttackerId, targetInstanceId: "face" });
    selectedAttackerId = null;
  }
}

$("oppHero").addEventListener("click", () => onHeroClick(false));
$("selfHero").addEventListener("click", () => onHeroClick(true));

$("btnEndTurn").addEventListener("click", () => {
  clearSelection();
  $("btnEndTurn").classList.add("action-pending");
  $("btnEndTurn").disabled = true;
  setTimeout(() => $("btnEndTurn").classList.remove("action-pending"), 1_500);
  window.ArcaneAudio?.playSfx("endTurn");
  send("endTurn", {});
});

$("btnSurrender").addEventListener("click", () => {
  if (!myState || myState.winner !== null) return;
  showSurrenderModal();
});

$("btnToggleHand").addEventListener("click", () => {
  if (shouldAutoHideHand(myState)) {
    const gameScreen = $("screen-game");
    if (!gameScreen.classList.contains("hand-collapsed")) {
      setHandCollapsed(true);
      return;
    }
    const previewOpen = gameScreen.classList.toggle("hand-preview-open");
    const button = $("btnToggleHand");
    button.setAttribute("aria-expanded", String(previewOpen));
    button.setAttribute("aria-label", previewOpen ? "Hide hand" : "Show hand");
    return;
  }
  setHandCollapsed(!$("screen-game").classList.contains("hand-collapsed"));
});

function hasPlayableHandCard(state) {
  const mana = Number(state?.me?.manaCurrent);
  return Number.isFinite(mana) && Boolean(state?.me?.hand?.some((card) => Number(card.cost) <= mana));
}

function shouldAutoHideHand(state) {
  return !state || state.winner !== null || !state.isYourTurn || !hasPlayableHandCard(state);
}

function setHandCollapsed(collapsed) {
  const gameScreen = $("screen-game");
  const button = $("btnToggleHand");
  gameScreen.classList.remove("hand-preview-open");
  gameScreen.classList.toggle("hand-collapsed", collapsed);
  button.setAttribute("aria-expanded", String(!collapsed));
  button.setAttribute("aria-label", collapsed ? "Show hand" : "Hide hand");
}

function syncHandVisibility(state) {
  const turnKey = `${state.roomCode || "local"}:${state.turnNumber}:${state.turn}`;
  const startsYourTurn = state.isYourTurn && turnKey !== lastHandTurnKey;
  lastHandTurnKey = turnKey;
  $("screen-game").classList.remove("hand-preview-open");
  setHandCollapsed(startsYourTurn ? false : shouldAutoHideHand(state));
}

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
  const selectedCard = targetingSpell ? state.me.hand[selectedHandIndex] : null;
  const enemyMinionOnly = cardRequiresEnemyMinionTarget(selectedCard);

  $("oppHero").classList.toggle("targetable", targetingAttack || (targetingSpell && !enemyMinionOnly));
  $("selfHero").classList.toggle("targetable", targetingSpell && !enemyMinionOnly);

  document.querySelectorAll("#oppBoard .minion-card").forEach((el) => {
    el.classList.toggle("targetable", targetingSpell || targetingAttack);
  });
  document.querySelectorAll("#selfBoard .minion-card").forEach((el) => {
    el.classList.toggle("targetable", targetingSpell && !enemyMinionOnly);
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
  // The result banner remains in the game screen, so it must explicitly
  // stop the board track instead of waiting for a later screen transition.
  window.ArcaneAudio?.stopMusic({ immediate: true });
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
  clearMultiplayerReconnect();
  clearMatchStatus();
  forgetMultiplayerMatch();
  activeMatchMode = null;
  hideRoundBanner();
  resetMatchIntro();
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

function activeStatuses(card) {
  return Array.isArray(card?.statuses) ? card.statuses : [];
}

function statusBadgesHTML(card) {
  return activeStatuses(card)
    .map((status) => `<span class="status-badge status-${status.type}" aria-label="${STATUS_FULL_LABEL[status.type] || status.type}" title="${escapeHtmlAttr(statusDescription(status))}">${STATUS_LABEL[status.type] || "?"}</span>`)
    .join("");
}

function statusDescription(status) {
  const amount = status.value || 1;
  const duration = status.turnsRemaining == null ? "permanently" : `for ${status.turnsRemaining} turn${status.turnsRemaining === 1 ? "" : "s"}`;
  switch (status.type) {
    case "weakened": return `Weakened: -${amount} Attack ${duration}.`;
    case "frozen": return `Frozen: cannot attack ${duration}.`;
    case "silenced": return "Silenced: abilities and keywords are removed permanently.";
    case "poisoned": return `Poisoned: takes ${amount} damage at the start of its turn, ${duration}.`;
    case "marked": return `Marked: the next damage taken is increased by ${amount}, ${duration}.`;
    default: return "Status effect.";
  }
}

function cardRequiresEnemyMinionTarget(card) {
  return Boolean(card?.abilities?.some((ability) =>
    ["applyStatus", "returnEnemyMinionToDeck"].includes(ability.effect) && ability.target === "enemyMinion"
  ));
}

function cardCostHTML(card) {
  // Board instances from matches created before a catalog update can carry a
  // stale cost. The catalog is the canonical visual source for every card ID.
  const cardId = card?.cardId || card?.id;
  const catalogCard = typeof TCGCards !== "undefined" ? TCGCards.getCardById(cardId) : null;
  const catalogCost = Number(catalogCard?.cost);
  const instanceCost = Number(card?.cost);
  const cost = Number.isFinite(catalogCost)
    ? catalogCost
    : Number.isFinite(instanceCost)
      ? instanceCost
      : 0;
  return `<span class="card-cost" aria-label="${cost} mana">${cost}</span>`;
}

function spellEffectValueHTML(card) {
  const value = Number(card?.value);
  if (card?.type !== "spell" || !["damage", "heal"].includes(card.effect) || !Number.isFinite(value)) {
    return "";
  }

  const label = card.effect === "damage" ? `${value} damage` : `${value} healing`;
  return `<span class="card-stat val spell-effect-${card.effect}" aria-label="${label}">${value}</span>`;
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
  const getCard = typeof card === "function" ? card : () => card;
  el.addEventListener("pointerdown", (event) => {
    if (canUseHoverTooltips()) return;
    hideCardTooltip();
    if (event.pointerType === "touch") startTouchCardTooltip(event, el, getCard);
  });
  el.addEventListener("contextmenu", (event) => {
    if (!canUseHoverTooltips()) event.preventDefault();
  });
  if (!canUseHoverTooltips()) return;

  el.addEventListener("mouseenter", (e) => showCardTooltip(getCard(), e));
  el.addEventListener("mousemove", positionCardTooltip);
  el.addEventListener("mouseleave", hideCardTooltip);
}

function showCardTooltip(card, e) {
  if (!canUseHoverTooltips()) return;
  populateCardTooltip(card);
  positionCardTooltip(e);
}

function populateCardTooltip(card) {
  const t = $("cardTooltip");
  const rarity = card.rarity || "common";

  const keywords = activeKeywords(card);
  const keywordsHTML = keywords.length
    ? `<div class="tooltip-keywords">${keywords
        .map((k) => `<span class="tooltip-kw kw-${k}">${keywordIconHTML(k)} ${KEYWORD_FULL_LABEL[k] || k}</span>`)
        .join("")}</div>`
    : "";
  const statuses = activeStatuses(card);
  const statusesHTML = statuses.length
    ? `<div class="tooltip-keywords tooltip-statuses">${statuses
        .map((status) => `<span class="tooltip-kw status-${status.type}">${escapeHtml(statusDescription(status))}</span>`)
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
    ${statusesHTML}
    ${card.lore ? `<div class="tooltip-lore">${escapeHtml(card.lore)}</div>` : ""}
  `;
  t.classList.remove("hidden");
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

let touchTooltipPress = null;
let suppressTouchTooltipClick = null;
let suppressTouchTooltipClickTimer = null;

function clearTouchCardTooltip({ hide = false } = {}) {
  if (!touchTooltipPress) return;
  clearTimeout(touchTooltipPress.timer);
  if (hide && touchTooltipPress.revealed) hideCardTooltip();
  touchTooltipPress = null;
}

function showTouchCardTooltip(card, element) {
  populateCardTooltip(card);
  const tooltip = $("cardTooltip");
  const cardRect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const edge = 8;
  const gap = 12;
  const x = Math.max(edge, Math.min(window.innerWidth - tooltipRect.width - edge, cardRect.left + (cardRect.width - tooltipRect.width) / 2));
  const above = cardRect.top - tooltipRect.height - gap;
  const below = cardRect.bottom + gap;
  const y = above >= edge ? above : Math.min(window.innerHeight - tooltipRect.height - edge, below);
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${Math.max(edge, y)}px`;
}

function startTouchCardTooltip(event, element, getCard) {
  clearTouchCardTooltip({ hide: true });
  const press = {
    element,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    revealed: false,
    timer: null,
  };
  press.timer = setTimeout(() => {
    if (touchTooltipPress !== press) return;
    press.revealed = true;
    showTouchCardTooltip(getCard(), element);
  }, TOUCH_TOOLTIP_HOLD_MS);
  touchTooltipPress = press;
}

document.addEventListener("pointermove", (event) => {
  const press = touchTooltipPress;
  if (!press || event.pointerId !== press.pointerId) return;
  if (Math.hypot(event.clientX - press.startX, event.clientY - press.startY) <= TOUCH_TOOLTIP_MOVE_TOLERANCE) return;
  clearTouchCardTooltip({ hide: press.revealed });
}, { passive: true });

function finishTouchCardTooltip(event) {
  const press = touchTooltipPress;
  if (!press || event.pointerId !== press.pointerId) return;
  if (press.revealed) {
    suppressTouchTooltipClick = press.element;
    clearTimeout(suppressTouchTooltipClickTimer);
    suppressTouchTooltipClickTimer = setTimeout(() => {
      suppressTouchTooltipClick = null;
    }, 500);
  }
  clearTouchCardTooltip({ hide: press.revealed });
}

document.addEventListener("pointerup", finishTouchCardTooltip, true);
document.addEventListener("pointercancel", () => clearTouchCardTooltip({ hide: true }), true);
document.addEventListener("click", (event) => {
  if (!suppressTouchTooltipClick) return;
  const suppress = suppressTouchTooltipClick.contains(event.target);
  suppressTouchTooltipClick = null;
  clearTimeout(suppressTouchTooltipClickTimer);
  if (!suppress) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}, true);

// Touch devices have no real "mouseleave" — the only way a tooltip
// closes there is by tapping somewhere else. This covers that case
// (and is harmless on desktop too).
document.addEventListener("pointerdown", (e) => {
  if (!canUseHoverTooltips() || !closestElement(e.target, ".minion-card, .hand-card")) hideCardTooltip();
});
document.addEventListener("scroll", () => {
  clearTouchCardTooltip({ hide: true });
  hideCardTooltip();
}, { capture: true, passive: true });
window.addEventListener("resize", () => {
  clearTouchCardTooltip({ hide: true });
  hideCardTooltip();
});
window.addEventListener("blur", () => {
  clearTouchCardTooltip({ hide: true });
  hideCardTooltip();
});
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

async function initAccountWidget({ skipActivityAutoLogin = false } = {}) {
  let data;
  accountState = { authEnabled: false, loggedIn: false, user: null };
  switchScreen("auth");
  setAuthGate("Checking Discord session...", false);
  try {
    const res = await apiFetch("/auth/me");
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
    void loadTournamentIncoming();
    if (data.dailyLoginReward?.claimed) {
      showToast(`Daily login reward: +${data.dailyLoginReward.goldAwarded} gold`);
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
    if (hasDiscordActivityParams() && !skipActivityAutoLogin) {
      $("btnLoginDiscord").classList.add("hidden");
      loginWithDiscordActivity({ automatic: true, showFailure: true });
      return;
    }
    setAuthGate("Login with Discord to enter Arcana TCG.", true);
    $("btnLoginDiscord").classList.remove("hidden");
  }
}

function isDiscordActivityEnvironment() {
  const params = new URLSearchParams(window.location.search);
  return (
    (params.has("frame_id") && params.has("instance_id") && params.has("platform")) ||
    window.location.host.endsWith(".discordsays.com") ||
    document.referrer.includes("discord.com") ||
    document.referrer.includes("discordsays.com")
  );
}

function hasDiscordActivityParams() {
  const params = new URLSearchParams(window.location.search);
  return params.has("frame_id") && params.has("instance_id") && params.has("platform");
}

function getDiscordActivitySdk() {
  if (discordActivitySdkPromise) return discordActivitySdkPromise;
  if (!hasDiscordActivityParams()) {
    return Promise.reject(new Error("Discord Activity parameters are missing."));
  }

  const clientId = accountState?.discordClientId || DISCORD_CLIENT_ID;
  discordActivitySdkPromise = import("./vendor/discord-embedded-app-sdk/index.mjs")
    .then(({ DiscordSDK, Events }) => {
      discordActivityEvents = Events;
      const discordSdk = new DiscordSDK(clientId, { disableConsoleLogOverride: true });
      discordActivityReadyPromise = discordSdk.ready();
      return discordSdk;
    })
    .catch((err) => {
      // Reset so the next login attempt can re-initialize the SDK
      discordActivitySdkPromise = null;
      discordActivityReadyPromise = null;
      throw err;
    });
  return discordActivitySdkPromise;
}

function startDiscordActivitySdk() {
  if (!hasDiscordActivityParams()) return;
  getDiscordActivitySdk()
    .then(async (discordSdk) => {
      await withTimeout(
        discordActivityReadyPromise || discordSdk.ready(),
        DISCORD_ACTIVITY_READY_TIMEOUT_MS,
        "Discord Activity SDK was not ready."
      );
      await subscribeToDiscordActivityLayoutUpdates(discordSdk);
    })
    .catch((err) => {
      reportClientLog("discord-activity-sdk-start-failed", {
        stage: err.stage || "construct",
        message: err.message || String(err),
      });
    });
}

function applyDiscordActivityLayoutMode(layoutMode) {
  const layoutNames = {
    0: "focused",
    1: "pip",
    2: "grid",
    "-1": "unhandled",
  };
  const name = layoutNames[layoutMode] || "unknown";
  document.documentElement.dataset.discordLayout = name;
  window.dispatchEvent(new CustomEvent("discordactivitylayoutchange", { detail: { layoutMode, name } }));
}

async function subscribeToDiscordActivityLayoutUpdates(discordSdk) {
  if (discordActivityLayoutSubscriptionPromise) return discordActivityLayoutSubscriptionPromise;

  const eventName = discordActivityEvents?.ACTIVITY_LAYOUT_MODE_UPDATE || "ACTIVITY_LAYOUT_MODE_UPDATE";
  const handleLayoutModeUpdate = ({ layout_mode: layoutMode } = {}) => {
    applyDiscordActivityLayoutMode(layoutMode);
  };

  discordActivityLayoutSubscriptionPromise = discordSdk.subscribe(eventName, handleLayoutModeUpdate).catch((err) => {
    discordActivityLayoutSubscriptionPromise = null;
    reportClientLog("discord-activity-layout-subscribe-failed", {
      message: err.message || String(err),
    });
  });
  return discordActivityLayoutSubscriptionPromise;
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
  apiFetch("/client-log", {
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

function readActivityAuthCache() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(ACTIVITY_AUTH_CACHE_KEY) || "null");
    return cached && typeof cached.accessToken === "string" ? cached : null;
  } catch {
    return null;
  }
}

function readActivitySessionToken() {
  return readActivityAuthCache()?.sessionToken || null;
}

function writeActivityAuthCache(data) {
  if (!data?.access_token) return;
  sessionStorage.setItem(
    ACTIVITY_AUTH_CACHE_KEY,
    JSON.stringify({
      accessToken: data.access_token,
      sessionToken: data.session_token || null,
      user: data.user || null,
    })
  );
}

function clearActivityAuthCache() {
  sessionStorage.removeItem(ACTIVITY_AUTH_CACHE_KEY);
}

async function createDiscordActivitySession(accessToken) {
  const response = await apiFetch("/auth/discord/activity", {
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

async function refreshAfterActivityLogin() {
  await initAccountWidget({ skipActivityAutoLogin: true });
  if (!accountState?.loggedIn) {
    const err = new Error("Discord Activity session was not retained.");
    err.stage = "session";
    throw err;
  }
}

async function loginWithDiscordActivity({ automatic = false, showFailure = true } = {}) {
  if (discordActivityLoginRunning) return false;
  if (!accountState?.discordClientId) {
    setAuthGate("Discord Activity login is not configured yet.", true);
    return false;
  }

  discordActivityLoginRunning = true;
  setAuthGate(automatic ? "Connecting to Discord..." : "Opening Discord authorization...", false);

  try {
    const cachedAuth = readActivityAuthCache();
    if (cachedAuth?.accessToken) {
      setAuthGate("Restoring Discord session...", false);
      try {
        const session = await createDiscordActivitySession(cachedAuth.accessToken);
        writeActivityAuthCache({
          access_token: cachedAuth.accessToken,
          session_token: session.session_token,
          user: session.user || cachedAuth.user,
        });
        discordActivityLoginRunning = false;
        await refreshAfterActivityLogin();
        return true;
      } catch {
        clearActivityAuthCache();
      }
      resumeSavedMultiplayerMatch();
    }

    const discordSdk = await getDiscordActivitySdk();
    await withTimeout(discordActivityReadyPromise || discordSdk.ready(), DISCORD_ACTIVITY_READY_TIMEOUT_MS, "Discord Activity SDK was not ready.")
      .catch((err) => {
        err.stage = "ready";
        throw err;
      });
    await subscribeToDiscordActivityLayoutUpdates(discordSdk);

    setAuthGate("Opening Discord authorization...", false);

    const state =
      window.crypto?.randomUUID?.() ||
      `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    const { code } = await discordSdk.commands
      .authorize({
        client_id: accountState.discordClientId,
        response_type: "code",
        state,
        prompt: "none",
        scope: ["identify"],
      })
      .catch(async (err) => {
        if (String(err.message || err).includes("Already authenticated")) {
          const auth = await discordSdk.commands.authenticate({ access_token: null }).catch(() => null);
          if (auth?.access_token) {
            const session = await createDiscordActivitySession(auth.access_token);
            writeActivityAuthCache({
              access_token: auth.access_token,
              session_token: session.session_token,
              user: session.user || auth.user,
            });
            discordActivityLoginRunning = false;
            await refreshAfterActivityLogin();
            return { code: null };
          }
        }
        err.stage = "authorize";
        throw err;
      });

    if (!code) return true;

    const response = await apiFetch("/auth/discord/activity", {
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
    writeActivityAuthCache(data);

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
    await refreshAfterActivityLogin();
    return true;
  } catch (err) {
    console.error("Discord Activity login failed:", err);
    reportClientLog("discord-activity-login-failed", {
      stage: err.stage || "unknown",
      message: err.message || String(err),
    });
    // Reset SDK promise so a retry can re-initialize from scratch
    discordActivitySdkPromise = null;
    discordActivityReadyPromise = null;
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
  if (hasDiscordActivityParams()) {
    await loginWithDiscordActivity({ automatic: false, showFailure: true });
    return;
  }
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

function setChangelogOpen(open) {
  const modal = $("changelogModal");
  if (!modal) return;
  modal.classList.toggle("hidden", !open);
  if (open) {
    markChangelogSeen();
    setMenuOptionsOpen(false);
  }
}

function markChangelogSeen() {
  try {
    localStorage.setItem(CHANGELOG_SEEN_STORAGE_KEY, CHANGELOG_VERSION);
  } catch (err) {
    // The badge remains visible if storage is unavailable.
  }
  syncChangelogNewBadge();
}

function syncChangelogNewBadge() {
  const badge = $("changelogNewBadge");
  if (!badge) return;
  let seenVersion = null;
  try {
    seenVersion = localStorage.getItem(CHANGELOG_SEEN_STORAGE_KEY);
  } catch (err) {
    // The badge remains visible if storage is unavailable.
  }
  badge.classList.toggle("hidden", seenVersion === CHANGELOG_VERSION);
}

function setHowToPlayOpen(open) {
  const modal = $("howToPlayModal");
  if (!modal) return;
  modal.classList.toggle("hidden", !open);
  if (open) setMenuOptionsOpen(false);
}

function setLegalNoticeOpen(noticeKey) {
  const modal = $("legalModal");
  const notice = window.ArcaneLegalNotices?.[noticeKey];
  if (!modal || !notice) return;
  $("legalTitle").textContent = notice.title;
  $("legalContent").innerHTML = notice.content;
  modal.classList.remove("hidden");
  setMenuOptionsOpen(false);
}

function closeLegalNotice() {
  $("legalModal")?.classList.add("hidden");
}

function setCardRequestOpen(open) {
  const modal = $("cardRequestModal");
  if (!modal) return;
  modal.classList.toggle("hidden", !open);
  if (!open) return;

  $("cardRequestStatus").classList.add("hidden");
  $("cardRequestStatus").textContent = "";
  setMenuOptionsOpen(false);
  setTimeout(() => $("cardRequestName")?.focus(), 0);
}

async function submitCardRequest() {
  if (!requireLoggedInForPlay()) return;
  const input = $("cardRequestName");
  const status = $("cardRequestStatus");
  const button = $("btnSubmitCardRequest");
  const wareraName = input.value.trim();
  if (!wareraName) {
    status.textContent = "Enter your Warera name first.";
    status.classList.remove("hidden");
    return;
  }

  button.disabled = true;
  try {
    const res = await apiFetch("/card-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wareraName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not save the card request.");
    status.textContent = "Request saved. Thank you.";
    status.classList.remove("hidden");
  } catch (err) {
    status.textContent = err.message || "Could not save the card request.";
    status.classList.remove("hidden");
  } finally {
    button.disabled = false;
  }
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
    const res = await apiFetch("/expansions/enabled");
    const data = await res.json();
    enabledExpansionIds = new Set((data.expansions || []).map((expansion) => expansion.id));
  } catch (err) {
    enabledExpansionIds = null;
  }
}

async function loadTournamentIncoming() {
  const notice = $("tournamentIncoming");
  if (!notice) return;
  notice.classList.add("hidden");
  try {
    const response = await apiFetch("/tournaments");
    const data = await response.json();
    if (!response.ok) return;
    const hasScheduledTournament = (data.tournaments || []).some((tournament) =>
      !["completed", "cancelled"].includes(tournament?.phase)
    );
    notice.classList.toggle("hidden", !hasScheduledTournament);
  } catch (err) {
    // A tournament alert is optional; never block the main menu on it.
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
  const mergedUser = accountState?.user || user;
  $("accountName").textContent = mergedUser.username || "Player";
  $("accountGold").textContent = `${mergedUser.gold || 0} gold`;
  if (user.cardCollection && accountState?.user) accountState.user.cardCollection = user.cardCollection;
  window.ArcaneAccountProfile?.syncUser(mergedUser);
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

window.ArcaneAccountProfile?.init({
  fetcher: apiFetch,
  getAccountState: () => accountState,
  showToast,
  switchScreen,
});

$("btnOpenTerms").addEventListener("click", () => setLegalNoticeOpen("terms"));
$("btnOpenPrivacy").addEventListener("click", () => setLegalNoticeOpen("privacy"));
$("btnOpenTermsMenu").addEventListener("click", () => setLegalNoticeOpen("terms"));
$("btnOpenPrivacyMenu").addEventListener("click", () => setLegalNoticeOpen("privacy"));
$("btnRequestCard").addEventListener("click", () => setCardRequestOpen(true));
$("btnCloseCardRequest").addEventListener("click", () => setCardRequestOpen(false));
$("btnSubmitCardRequest").addEventListener("click", submitCardRequest);
$("cardRequestModal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) setCardRequestOpen(false);
});
$("btnCloseLegal").addEventListener("click", closeLegalNotice);
$("legalModal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeLegalNotice();
});

$("btnEmotes").addEventListener("click", () => {
  if (!myState || myState.winner !== null) return;
  const panel = $("emotePanel");
  const open = panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !open);
  $("btnEmotes").setAttribute("aria-expanded", String(open));
});

$("emotePanel").addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest(".emote-choice") : null;
  if (!button || !myState || myState.winner !== null) return;
  closeEmotePanel();
  send("emote", { emote: button.dataset.emote });
});

document.addEventListener("pointerdown", (event) => {
  if (!(event.target instanceof Element) || !event.target.closest(".emote-control")) closeEmotePanel();
});

$("btnMoreOptions").addEventListener("click", (event) => {
  event.stopPropagation();
  toggleMenuOptions();
});

$("btnInviteDiscordActivity").addEventListener("click", inviteDiscordActivity);

$("btnOpenAudioConfig").addEventListener("click", () => {
  setMenuOptionsOpen(false);
  setAudioConfigOpen(true);
});

$("btnOpenChangelog").addEventListener("click", () => setChangelogOpen(true));
syncChangelogNewBadge();
$("btnCloseChangelog").addEventListener("click", () => setChangelogOpen(false));
$("changelogModal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) setChangelogOpen(false);
});

$("btnOpenHowToPlay").addEventListener("click", () => setHowToPlayOpen(true));
$("btnCloseHowToPlay").addEventListener("click", () => setHowToPlayOpen(false));
$("howToPlayModal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) setHowToPlayOpen(false);
});

$("btnCloseAudioConfig").addEventListener("click", () => setAudioConfigOpen(false));
$("musicVolumeInput").addEventListener("input", (event) => updateVolumeFromInput("music", event.target.value));
$("sfxVolumeInput").addEventListener("input", (event) => updateVolumeFromInput("sfx", event.target.value));

document.addEventListener("click", (event) => {
  if (!closestElement(event.target, ".menu-options")) setMenuOptionsOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setChangelogOpen(false);
    closeLegalNotice();
  }
});

$("screen-enter").addEventListener("click", enterMainMenu);
$("screen-enter").addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") enterMainMenu();
});

startDiscordActivitySdk();
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
  if (card.classList.contains("dying") || card.classList.contains("inventory-card-locked") || card.dataset.dragArmed) return;

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
  if (card.classList.contains("dying") || card.classList.contains("inventory-card-locked") || card.dataset.dragArmed) return;

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
    const handRestY = card.style.getPropertyValue("--hand-rest-y") || "0px";
    const handAngle = card.style.getPropertyValue("--hand-angle") || "0deg";
    if (card.classList.contains("selected")) {
      baseTranslateY = `calc(${handRestY} - 34px)`;
    } else {
      baseTranslateY = `calc(${handRestY} - 28px)`;
    }
    card.style.transform = `translateY(${baseTranslateY}) rotate(${handAngle}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  } else if (card.classList.contains("minion-card")) {
    if (card.classList.contains("selected")) {
      baseTranslateY = "-5px";
    } else {
      baseTranslateY = "-5px"; // Match CSS hover lift
    }
    card.style.transform = `translateY(${baseTranslateY}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }
  card.style.zIndex = card.classList.contains("hand-card") ? "40" : "10";

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
    if (card.dataset.dragArmed) return;
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
