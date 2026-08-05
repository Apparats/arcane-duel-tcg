// ============================================================
// CLIENT - vanilla JS, no dependencies, no build step.
// ============================================================

const KEYWORD_LABEL = { divineShield: "*" };
const KEYWORD_ICON = {
  taunt:
    '<svg class="keyword-icon keyword-icon-taunt" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v6c0 4.4 2.9 7.4 7 9 4.1-1.6 7-4.6 7-9V6l-7-3Z" fill="currentColor"/></svg>',
  charge:
    '<svg class="keyword-icon keyword-icon-charge" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="currentColor"/></svg>',
  divineShield:
    '<svg class="keyword-icon keyword-icon-divine-shield" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8 5.2 5.8v5.7c0 4.1 2.7 7.1 6.8 8.9 4.1-1.8 6.8-4.8 6.8-8.9V5.8L12 2.8Z" fill="currentColor"/><path d="M12 6.2v9.9M8.3 10.1h7.4" stroke="rgba(255,255,255,.82)" stroke-width="1.7" stroke-linecap="round"/></svg>',
};
const KEYWORD_SUMMON_EFFECT_ORDER = ["taunt", "charge", "divineShield"];
const KEYWORD_FULL_LABEL = { taunt: "Taunt", charge: "Charge", divineShield: "Divine Shield" };
const STATUS_LABEL = {
  weakened: "W",
  frozen: "F",
  silenced: "X",
  poisoned: "P",
  marked: "!",
  burning: "B",
  drunk: "D",
  confused: "?",
  dodge: "DG",
};
const STATUS_FULL_LABEL = {
  weakened: "Weakened",
  frozen: "Frozen",
  silenced: "Silenced",
  poisoned: "Poisoned",
  marked: "Marked",
  burning: "Burning",
  drunk: "Drunk",
  confused: "Confusion",
  dodge: "Dodge",
};
const RARITY_LABEL = { common: "Common", rare: "Rare", legendary: "Legendary", mythic: "Mythic", souvenir: "Souvenir" };
const COUNTRY_CODE_BY_NAME = Object.freeze({
  argentina: "ar",
  austria: "at",
  belgium: "be",
  bolivia: "bo",
  brazil: "br",
  chad: "td",
  chile: "cl",
  croatia: "hr",
  cyprus: "cy",
  czechia: "cz",
  denmark: "dk",
  djibouti: "dj",
  egypt: "eg",
  eeuu: "us",
  finland: "fi",
  france: "fr",
  germany: "de",
  guatemala: "gt",
  honduras: "hn",
  iceland: "is",
  india: "in",
  indonesia: "id",
  iraq: "iq",
  ireland: "ie",
  italy: "it",
  japan: "jp",
  latvia: "lv",
  lithuania: "lt",
  luxembourg: "lu",
  luxemburg: "lu",
  malaysia: "my",
  malta: "mt",
  morocco: "ma",
  netherlands: "nl",
  "new zealand": "nz",
  nigeria: "ng",
  norway: "no",
  oman: "om",
  poland: "pl",
  portugal: "pt",
  romania: "ro",
  rwanda: "rw",
  serbia: "rs",
  "sierra leone": "sl",
  "solomon islands": "sb",
  "south africa": "za",
  "south korea": "kr",
  spain: "es",
  "sri lanka": "lk",
  sweden: "se",
  tanzania: "tz",
  thailand: "th",
  ukraine: "ua",
  "united kingdom": "gb",
  "united states": "us",
  usa: "us",
  uzbekistan: "uz",
  vanuatu: "vu",
  vatican: "va",
  venezuela: "ve",
  yemen: "ye",
});
const COUNTRY_FLAG_DESIGN_BY_CODE = Object.freeze({
  ar: { type: "horizontal", colors: ["#74acdf", "#ffffff", "#74acdf"], emblem: "sun" },
  at: { type: "horizontal", colors: ["#ed2939", "#ffffff", "#ed2939"] },
  be: { type: "vertical", colors: ["#000000", "#ffd90c", "#ef3340"] },
  bo: { type: "horizontal", colors: ["#d52b1e", "#f9e300", "#007934"] },
  br: { type: "diamond", base: "#009b3a", diamond: "#ffdf00", circle: "#002776" },
  cl: { type: "canton", base: "#d52b1e", top: "#ffffff", canton: "#0039a6", star: true },
  cy: { type: "solid", base: "#ffffff", emblem: "cyprus" },
  cz: { type: "triangle", colors: ["#ffffff", "#d7141a"], triangle: "#11457e" },
  de: { type: "horizontal", colors: ["#000000", "#dd0000", "#ffce00"] },
  dk: { type: "nordic", base: "#c60c30", cross: "#ffffff" },
  dj: { type: "triangle", colors: ["#6ab2e7", "#12ad2b"], triangle: "#ffffff", starColor: "#d7141a" },
  eg: { type: "horizontal", colors: ["#ce1126", "#ffffff", "#000000"], emblem: "gold" },
  es: { type: "horizontal", colors: ["#aa151b", "#f1bf00", "#aa151b"], weights: [1, 2, 1] },
  fi: { type: "nordic", base: "#ffffff", cross: "#002f6c" },
  fr: { type: "vertical", colors: ["#0055a4", "#ffffff", "#ef4135"] },
  gb: { type: "union" },
  gt: { type: "vertical", colors: ["#4997d0", "#ffffff", "#4997d0"], emblem: "green" },
  hn: { type: "horizontal", colors: ["#0073cf", "#ffffff", "#0073cf"], emblem: "stars" },
  hr: { type: "horizontal", colors: ["#ff0000", "#ffffff", "#171796"], emblem: "checker" },
  id: { type: "horizontal", colors: ["#ce1126", "#ffffff"] },
  ie: { type: "vertical", colors: ["#169b62", "#ffffff", "#ff883e"] },
  in: { type: "horizontal", colors: ["#ff9933", "#ffffff", "#138808"], emblem: "wheel" },
  iq: { type: "horizontal", colors: ["#ce1126", "#ffffff", "#000000"], emblem: "green" },
  is: { type: "nordic", base: "#02529c", cross: "#ffffff", inner: "#dc1e35" },
  it: { type: "vertical", colors: ["#009246", "#ffffff", "#ce2b37"] },
  jp: { type: "circle", base: "#ffffff", circle: "#bc002d" },
  kr: { type: "taegeuk" },
  lt: { type: "horizontal", colors: ["#fdb913", "#006a44", "#c1272d"] },
  lk: { type: "vertical", colors: ["#00534e", "#ff9e1b", "#8d153a"], weights: [1, 1, 4] },
  lu: { type: "horizontal", colors: ["#ef3340", "#ffffff", "#00a3e0"] },
  lv: { type: "horizontal", colors: ["#9e3039", "#ffffff", "#9e3039"], weights: [2, 1, 2] },
  ma: { type: "solid", base: "#c1272d", emblem: "starGreen" },
  mt: { type: "vertical", colors: ["#ffffff", "#cf142b"], emblem: "cross" },
  my: { type: "canton-stripes", canton: "#010066", moon: "#ffcc00" },
  ng: { type: "vertical", colors: ["#008753", "#ffffff", "#008753"] },
  nl: { type: "horizontal", colors: ["#ae1c28", "#ffffff", "#21468b"] },
  no: { type: "nordic", base: "#ba0c2f", cross: "#ffffff", inner: "#00205b" },
  nz: { type: "blue-stars", base: "#00247d" },
  om: { type: "oman" },
  pl: { type: "horizontal", colors: ["#ffffff", "#dc143c"] },
  pt: { type: "portugal" },
  ro: { type: "vertical", colors: ["#002b7f", "#fcd116", "#ce1126"] },
  rs: { type: "horizontal", colors: ["#c6363c", "#0c4076", "#ffffff"], emblem: "gold" },
  rw: { type: "horizontal", colors: ["#00a1de", "#fad201", "#20603d"], weights: [2, 1, 1], emblem: "sunRight" },
  sb: { type: "diagonal", a: "#0051ba", b: "#215b33", stripe: "#fcd116" },
  se: { type: "nordic", base: "#006aa7", cross: "#fecc00" },
  sl: { type: "horizontal", colors: ["#1eb53a", "#ffffff", "#0072c6"] },
  td: { type: "vertical", colors: ["#002664", "#fecb00", "#c60c30"] },
  th: { type: "horizontal", colors: ["#a51931", "#ffffff", "#2d2a4a", "#ffffff", "#a51931"], weights: [1, 1, 2, 1, 1] },
  tz: { type: "diagonal", a: "#1eb53a", b: "#00a3dd", stripe: "#000000", border: "#fcd116" },
  ua: { type: "horizontal", colors: ["#0057b7", "#ffd700"] },
  us: { type: "canton-stripes", canton: "#3c3b6e", stars: true },
  uz: { type: "horizontal", colors: ["#1eb5e5", "#ffffff", "#009739"], weights: [2, 1, 2], emblem: "moon" },
  va: { type: "vertical", colors: ["#ffe000", "#ffffff"], emblem: "gold" },
  ve: { type: "horizontal", colors: ["#fcd116", "#003893", "#ce1126"], emblem: "stars" },
  vu: { type: "triangle", colors: ["#d21034", "#009543"], triangle: "#000000", starColor: "#ffd100" },
  ye: { type: "horizontal", colors: ["#ce1126", "#ffffff", "#000000"] },
  za: { type: "south-africa" },
});
const BABU2_CARD_ID = "expansion2:Babu2";
const SECOND_PLAYER_MANA_CARD_ID = "special:manaspark";
const DISCORD_CLIENT_ID = "1523179359106502716";
const CHANGELOG_VERSION = "1.7";
const CHANGELOG_SEEN_STORAGE_KEY = "arcane_changelog_seen_version";
const CARD_ART_ASSET_VERSION = "1.7-art768";
const ACTIVITY_AUTH_CACHE_KEY = "arcane_activity_auth";
const ACTIVITY_INVITE_SEEN_STORAGE_KEY = "arcane_activity_invite_seen_v1";
const TYPE_ICON = { minion: "X", spell: "*" };

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
const SPELL_REVEAL_MS = 1100;
const TOUCH_TOOLTIP_HOLD_MS = 500;
const TOUCH_TOOLTIP_MOVE_TOLERANCE = 10;
let quickplaySearching = false;
let singleplayerStartPending = false;
let screenTransitionTimer = null;
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
let forfeitResultMessage = "";
let quickplayRankingView = "wins";
let quickplayRankingLoadSeq = 0;

let lastAnimatedActionSeq = 0; // avoids replaying the same attack's animation
let lastAnimatedSpecialAbilitySeq = 0;
let lastRoundBannerKey = null;
let stateQueue = [];
let isApplyingStateQueue = false;
let stateQueueGeneration = 0;
let roundBannerMode = null;
let pendingHandPlayAnimation = null;
let battleRevealGeneration = 0;
let battleRevealTail = Promise.resolve();
let activeBattleReveal = null;
const predictedAttackKeys = new Set();
let turnClockOffsetMs = 0;
let turnTimerInterval = null;
let lastHandTurnKey = null;
let lastMobileAutoHideKey = null;
let handManualVisibility = null;
let mulliganRoomCode = null;
let mulliganSelectedIndexes = new Set();
let mulliganTimerInterval = null;
let mulliganDeadline = 0;
let mulliganStartsAt = 0;
let mulliganClockOffsetMs = 0;
let mulliganLastServerNow = null;
let mulliganRenderTimer = null;
let mulliganTransitionTimer = null;
let mulliganReplacementIndexes = null;
let mulliganReplacementState = null;
let mulliganResultShownAt = 0;
let handRevealTimer = null;
let localMulligan = null;
let localMulliganTimer = null;
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
      setSingleplayerStartPending(false);
      if (shouldReconnectMultiplayer()) {
        showToast("Connection lost. Reconnecting to your match...");
        beginMultiplayerReconnect();
        return;
      }
      setQuickplaySearching(false);
      setRankedSearching(false);
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

function setOpponentReconnectPaused(paused) {
  $("screen-game")?.classList.toggle("match-reconnecting", paused);
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
  setOpponentReconnectPaused(true);
  const deadline = Number(payload.reconnectDeadline);
  const isTournament = payload.isTournament === true;
  const update = () => {
    const seconds = Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : null;
    const suffix = seconds == null ? "" : ` ${seconds}s`;
    setMatchStatus(isTournament ? `Match paused. Opponent disconnected. Tournament victory by forfeit in${suffix}.` : `Match paused. Opponent disconnected. Victory by forfeit in${suffix}.`, { warning: true });
    if (seconds === 0) {
      clearInterval(matchStatusTimer);
      matchStatusTimer = null;
    }
  };
  update();
  if (Number.isFinite(deadline)) matchStatusTimer = setInterval(update, 250);
}

function showSelfReconnectStatus() {
  clearInterval(matchStatusTimer);
  setOpponentReconnectPaused(true);
  const update = () => {
    const seconds = Math.max(0, Math.ceil((reconnectDeadline - Date.now()) / 1000));
    setMatchStatus(`Connection lost. Reconnecting to this match automatically... ${seconds}s left. Keep this screen open.`, { warning: true });
    if (seconds === 0) {
      clearInterval(matchStatusTimer);
      matchStatusTimer = null;
    }
  };
  update();
  matchStatusTimer = setInterval(update, 250);
}

function beginMultiplayerReconnect() {
  if (!shouldReconnectMultiplayer()) return;
  reconnectingMultiplayer = true;
  if (!reconnectDeadline) reconnectDeadline = Date.now() + RECONNECT_WINDOW_MS;
  showSelfReconnectStatus();
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
    }).catch(() => {
      if (reconnectingMultiplayer) scheduleMultiplayerReconnect(RECONNECT_RETRY_MS);
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
  lastAnimatedSpecialAbilitySeq = 0;
  lastRoundBannerKey = null;
  resetStateQueue();
  resetMatchIntro();
  localGame = new TCGEngine.Game("LOCAL", playerName || "You", "NPC");
  startLocalMulligan();
  switchScreen("game");
  refreshLocalState();
}

function startServerSingleplayer() {
  if (singleplayerStartPending) return;
  cancelActiveMatchSearch();
  setSingleplayerStartPending(true);
  clearMultiplayerReconnect();
  forgetMultiplayerMatch();
  isLocalMode = false;
  activeMatchMode = "singleplayer";
  myState = null;
  lastAnimatedActionSeq = 0;
  lastAnimatedSpecialAbilitySeq = 0;
  lastRoundBannerKey = null;
  resetStateQueue();
  lastEconomyUpdate = null;
  connect(() => send("startSingleplayer", {})).catch(() => {
    setSingleplayerStartPending(false);
  });
}

async function handleLocalAction(type, payload) {
  try {
    if (type === "emote") {
      showEmote(payload?.emote, true);
      return;
    } else if (type === "replaceOpeningHand") {
      if (!localMulligan?.active) return;
      localGame.replaceOpeningHandCards(0, Array.isArray(payload?.handIndexes) ? payload.handIndexes : []);
      finishLocalMulligan();
      return;
    } else if (localMulligan?.active && type !== "surrender") {
      showToast("Choose your opening hand first.");
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
    if (type === "replaceOpeningHand" && $("btnMulliganReplace")) $("btnMulliganReplace").disabled = false;
    showToast(err.message);
    return;
  }
  refreshLocalState();

  if (localGame.winner === null && localGame.turn === 1) {
    runNpcTurn();
  }
}

function refreshLocalState() {
  const state = localGame.getStateFor(0);
  if (localMulligan?.active) {
    state.serverNow = Date.now();
    state.mulligan = {
      active: true,
      deadline: localMulligan.deadline,
      startsAt: localMulligan.startsAt,
      remainingMs: Math.max(0, localMulligan.deadline - Date.now()),
      confirmed: false,
      opponentConfirmed: true,
    };
  }
  applyIncomingState(state);
}

function clearLocalMulligan() {
  if (localMulliganTimer) {
    clearTimeout(localMulliganTimer);
    localMulliganTimer = null;
  }
  localMulligan = null;
}

function finishLocalMulligan() {
  clearLocalMulligan();
  refreshLocalState();
}

function startLocalMulligan() {
  const startsAt = Date.now() + 4_200;
  localMulligan = {
    active: true,
    startsAt,
    deadline: startsAt + 25_000,
  };
  localMulliganTimer = setTimeout(() => {
    finishLocalMulligan();
  }, 29_200);
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
  lastAnimatedSpecialAbilitySeq = 0;
  handManualVisibility = null;
  clearLocalMulligan();
  resetMulliganOverlay();
  resetBattleRevealQueue();
}

function applyIncomingState(newState) {
  showMatchIntro(newState);
  stateQueue.push(newState);
  processStateQueue();
}

function latestSpecialAbilityActivationSeq(state) {
  return (state?.specialAbilityActivations || []).reduce((maxSeq, activation) => {
    const seq = Number(activation?.seq) || 0;
    return Math.max(maxSeq, seq);
  }, 0);
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

function normalizeRankDisplay(rank) {
  const name = String(rank?.name || "").trim().toLowerCase();
  const id = String(rank?.id || "").trim().toLowerCase();
  if (!rank || id === "arena" || id === "sand" || name === "arena" || name === "arena (sand)" || name === "sand" || !name) {
    return {
      ...(rank || {}),
      id: "sand",
      name: "Sand",
      color: rank?.color || "#8ddcff",
      icon: rank?.icon || "*",
    };
  }
  return rank;
}

function normalizeRankedDisplay(ranked) {
  const rating = Number(ranked?.rating || 0);
  return {
    ...(ranked || {}),
    rating: Number.isFinite(rating) ? Math.max(0, rating) : 0,
    rank: normalizeRankDisplay(ranked?.rank),
  };
}

function rankIconMarkup(rank) {
  const visibleRank = normalizeRankDisplay(rank);
  const icons = {
    sand: '<svg class="rank-icon-svg rank-icon-sand" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6" style="fill:currentColor;stroke:none;opacity:.14"/><circle cx="12" cy="12" r="8.6"/><path d="M4.4 16.1c2.1-1.9 4.7-2.9 7.6-2.9s5.5 1 7.6 2.9"/><path d="M6.4 18.6c1.6-.9 3.5-1.3 5.6-1.3s4 .4 5.6 1.3"/><path d="m12 5.2 2.1 4.1L12 10.7 9.9 9.3 12 5.2Z"/></svg>',
    bronze: '<svg class="rank-icon-svg rank-icon-bronze" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 5.2 6.1v5.4c0 4.2 2.7 7.1 6.8 8.7 4.1-1.6 6.8-4.5 6.8-8.7V6.1L12 3.2Z" style="fill:currentColor;stroke:none;opacity:.16"/><path d="M12 3.2 5.2 6.1v5.4c0 4.2 2.7 7.1 6.8 8.7 4.1-1.6 6.8-4.5 6.8-8.7V6.1L12 3.2Z"/><path d="M8 8.7h8"/><path d="m8.4 11.7 3.6 2.5 3.6-2.5"/><path d="m8.8 15 3.2 2.1 3.2-2.1"/></svg>',
    gold: '<svg class="rank-icon-svg rank-icon-gold" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="11.2" r="4.4" style="fill:currentColor;stroke:none;opacity:.18"/><circle cx="12" cy="11.2" r="4.4"/><path d="M12 3.4v2.2M12 16.8V19M4.2 11.2h2.2M17.6 11.2h2.2M6.5 5.7l1.6 1.6M15.9 15.1l1.6 1.6M17.5 5.7l-1.6 1.6M8.1 15.1l-1.6 1.6"/><path d="M7 19.2c1.3 1 3 1.5 5 1.5s3.7-.5 5-1.5"/></svg>',
    diamond: '<svg class="rank-icon-svg rank-icon-diamond" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 20.5 12 12 20.8 3.5 12 12 3.2Z" style="fill:currentColor;stroke:none;opacity:.16"/><path d="M12 3.2 20.5 12 12 20.8 3.5 12 12 3.2Z"/><path d="M7.4 12 12 3.2 16.6 12 12 20.8 7.4 12Z"/><path d="M3.5 12h17"/><path d="m7.4 12 2.1-5.2h5L16.6 12"/></svg>',
    master: '<svg class="rank-icon-svg rank-icon-master" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 17.3h15l-1.1-8-4.1 3-2.3-7-2.3 7-4.1-3-1.1 8Z" style="fill:currentColor;stroke:none;opacity:.18"/><path d="M4.5 17.3h15l-1.1-8-4.1 3-2.3-7-2.3 7-4.1-3-1.1 8Z"/><path d="M6 20.5h12"/><path d="M9.2 17.3 12 5.3l2.8 12"/><path d="M8.2 8.2 12 4l3.8 4.2"/><circle cx="12" cy="12.2" r="1.5"/></svg>',
  };
  return icons[visibleRank.id] || icons.sand;
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
      quickplayRank: profile.quickplayRank,
      bestQuickplayRank: profile.quickplayBestRank ?? profile.stats?.bestQuickplayRank,
    })
    : null;
  const ranked = normalizeRankedDisplay(profile.ranked);
  return {
    username: profile.username || participant?.name || "Player",
    avatarUrl: profile.avatarUrl || participant?.avatarUrl || null,
    title: selected?.name || progress?.selectedTitle?.name || "Arcane Initiate",
    ranked,
    badges: profile.equippedBadges || progress?.equippedBadges || [],
    starts: participant?.starts === true,
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
  const titleRow = document.createElement("div");
  titleRow.className = "match-intro-title-row";
  const title = document.createElement("div");
  title.className = "match-intro-title";
  title.textContent = profile.title;
  titleRow.append(title);
  if (profile.starts) {
    const starts = document.createElement("span");
    starts.className = "match-intro-starts";
    starts.textContent = "Starts";
    titleRow.append(starts);
  }
  const rank = normalizeRankDisplay(profile.ranked?.rank);
  const rankBadge = document.createElement("div");
  rankBadge.className = "match-intro-rank";
  rankBadge.style.setProperty("--rank-color", rank.color || "#8ddcff");
  const rankIcon = document.createElement("span");
  rankIcon.className = "match-intro-rank-icon";
  rankIcon.innerHTML = rankIconMarkup(rank);
  const rankName = document.createElement("strong");
  rankName.textContent = rank.name || "Sand";
  const rankRating = document.createElement("small");
  rankRating.textContent = `${Number(profile.ranked?.rating || 0)} rating`;
  rankBadge.append(rankIcon, rankName, rankRating);
  const badges = document.createElement("div");
  badges.className = "match-intro-badges";
  (profile.badges || []).slice(0, 3).forEach((badge) => {
    const badgeElement = document.createElement("span");
    badgeElement.className = "match-intro-badge";
    badgeElement.title = badge.name || "Achievement badge";
    badgeElement.innerHTML = window.ArcaneProfileBadges?.badgeMarkup(badge.id, true) || "";
    badges.append(badgeElement);
  });
  copy.append(name, titleRow, rankBadge, badges);
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
    matchIntroTimer = setTimeout(() => {
      intro.classList.add("hidden");
      if (myState?.mulligan?.active) renderMulligan(myState);
    }, fadeOutMs);
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
  const reveal = activeBattleReveal;
  if (reveal) {
    await reveal;
    if (generation !== stateQueueGeneration) return;
  }

  const prev = myState;
  if (!prev) lastAnimatedSpecialAbilitySeq = latestSpecialAbilityActivationSeq(newState);
  const diff = prev ? computeAndPlayImpactAnimations(prev, newState) : { anyImpact: false, newMinions: [], pendingSpecialActivations: [] };
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
  diff.newMinions.forEach(({ id, isSelf, cardId, keywords }) => {
    const el = findCardElement(id);
    if (!el) return;
    const playedFromHand = isSelf && animateCardFromHand(el, cardId);
    if (playedFromHand) {
      setTimeout(() => spawnKeywordSummonEffect(el, keywords), 450);
      return;
    }
    el.classList.add("summoned");
    requestAnimationFrame(() => spawnKeywordSummonEffect(el, keywords));
  });
  diff.pendingSpecialActivations.forEach((activation) => {
    flashSpecialAbilityBadge(activation.instanceId);
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
    case "rankedQueued":
      setRankedSearching(true);
      break;
    case "tournamentMatchQueued":
      window.ArcaneTournaments?.setQueuedMatch(msg.payload);
      showToast("Waiting for your tournament opponent to enter the match.");
      break;
    case "tournamentMatchPreparing":
      window.ArcaneTournaments?.setPreparingMatch(msg.payload);
      showToast("Both tournament players are ready. Preparing the match.");
      break;
    case "tournamentMatchUnavailable":
      window.ArcaneTournaments?.clearQueuedMatch(msg.payload);
      showToast(msg.payload?.message || "Tournament match preparation stopped. Please enter again.");
      void window.ArcaneTournaments?.load();
      break;
    case "tournamentNoShowWin":
      window.ArcaneTournaments?.clearQueuedMatch(msg.payload);
      showToast("Your opponent did not enter. You advance by tournament forfeit.");
      void window.ArcaneTournaments?.load();
      break;
    case "tournamentUpdated":
      void window.ArcaneTournaments?.load();
      break;
    case "tournamentPrize":
      updateAccountDisplay({ ...(accountState?.user || {}), gold: msg.payload?.balance, stats: msg.payload?.stats || accountState?.user?.stats || {} });
      showToast(`Tournament ${msg.payload?.place || "prize"}: +${msg.payload?.gold || 0} gold`);
      break;
    case "matchStarted":
      if (quickplaySearching || rankedSearching) window.ArcaneAudio?.playSfx("matchFound");
      setRankedSearching(false);
      window.ArcaneTournaments?.clearQueuedMatch();
      window.ArcaneTournaments?.setVisible(false);
      forfeitResultMessage = "";
      setOpponentReconnectPaused(false);
      setQuickplaySearching(false);
      setSingleplayerStartPending(false);
      activeMatchMode = activeMatchMode || "multiplayer";
      if (activeMatchMode === "multiplayer") rememberMultiplayerMatch();
      else forgetMultiplayerMatch();
      myState = null;
      lastAnimatedActionSeq = 0;
      lastAnimatedSpecialAbilitySeq = 0;
      lastRoundBannerKey = null;
      resetStateQueue();
      resetMatchIntro();
      switchScreen("game");
      break;
    case "matchResumed":
      clearMultiplayerReconnect();
      setOpponentReconnectPaused(false);
      clearMatchStatus();
      activeMatchMode = "multiplayer";
      rememberMultiplayerMatch();
      switchScreen("game");
      showToast("Match reconnected.");
      break;
    case "state":
      applyIncomingState(msg.payload);
      break;
    case "spellCast":
      queueBattleReveal(() => showSpellCastReveal(msg.payload?.cardId));
      break;
    case "mythicSummon":
      queueBattleReveal(() => showMythicSummonReveal(msg.payload?.cardId));
      break;
    case "shieldChallengeStart":
      window.ArcaneShieldChallenge?.start(msg.payload, (challengeId, direction) => {
        send("shieldChallengeInput", { challengeId, direction });
      });
      break;
    case "shieldChallengeResult":
      window.ArcaneShieldChallenge?.finish(msg.payload);
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
        gold: msg.payload?.gold ?? accountState?.user?.gold ?? 0,
        stats: msg.payload?.stats || accountState?.user?.stats || {},
        modeStats: msg.payload?.modeStats || accountState?.user?.modeStats || {},
      });
      const cards = msg.payload?.cards || [];
      if (activeCampaignStage) activeCampaignStage.cardDrops = msg.payload?.cardDrops || activeCampaignStage.cardDrops;
      if (msg.payload?.goldAwarded > 0) {
        showToast(`Campaign reward: +${msg.payload.goldAwarded} gold.`);
      }
      if (cards.length > 0) {
        queueCardOpening({ title: `${activeCampaignStage?.name || "Campaign"} reward`, summary: `${cards.length} random card revealed.`, cards });
      } else if (msg.payload?.goldAlreadyClaimed) {
        showToast(`${activeCampaignStage?.name || "Campaign"} gold reward was already claimed.`);
      }
      break;
    }
    case "profileStatsUpdate":
      updateAccountDisplay({
        ...(accountState?.user || {}),
        stats: msg.payload?.stats || accountState?.user?.stats || {},
        modeStats: msg.payload?.modeStats || accountState?.user?.modeStats || {},
        ranked: msg.payload?.ranked || accountState?.user?.ranked,
      });
      break;
    case "opponentDisconnected":
      showOpponentDisconnectStatus(msg.payload);
      showToast(msg.payload?.isTournament ? "Opponent disconnected. Tournament forfeit begins in 30 seconds." : "Opponent disconnected. The match is paused while they reconnect.");
      break;
    case "opponentReconnected":
      setOpponentReconnectPaused(false);
      clearMatchStatus();
      if (myState?.tournament) setMatchStatus("Tournament match | 30 seconds per turn");
      showToast("Your opponent reconnected.");
      break;
    case "tournamentForfeitWin":
      clearInterval(matchStatusTimer);
      matchStatusTimer = null;
      setOpponentReconnectPaused(false);
      forfeitResultMessage = "Tournament victory by forfeit";
      setMatchStatus("Opponent did not return. Tournament victory by forfeit.");
      showToast("Your opponent did not return. You win this tournament match by forfeit.");
      break;
    case "opponentForfeitWin":
      clearInterval(matchStatusTimer);
      matchStatusTimer = null;
      setOpponentReconnectPaused(false);
      forfeitResultMessage = "Victory by forfeit";
      setMatchStatus("Opponent did not return. Victory by forfeit.");
      showToast("Your opponent did not return. You win by forfeit.");
      break;
    case "matchCancelled":
      setOpponentReconnectPaused(false);
      clearMatchStatus();
      clearMultiplayerReconnect();
      setSingleplayerStartPending(false);
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
      if (myState?.mulligan?.active && $("btnMulliganReplace")) $("btnMulliganReplace").disabled = false;
      setQuickplaySearching(false);
      setSingleplayerStartPending(false);
      showToast(msg.payload.message);
      break;
  }
}

// ---------------- ANIMATIONS (diffed against the previous state) ----------------
// This is all purely visual: compares "before" vs "after" health/board
// and fires short-lived CSS classes. If something here fails (e.g. an
// element isn't found), it must not break the game - that's why every
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

function spawnKeywordSummonEffect(targetEl, keywords = []) {
  const visibleKeywords = KEYWORD_SUMMON_EFFECT_ORDER.filter((keyword) => keywords.includes(keyword));
  if (!targetEl?.isConnected || visibleKeywords.length === 0) return false;
  const boardEl = document.querySelector(".board");
  if (!boardEl) return false;
  const targetRect = targetEl.getBoundingClientRect();
  const boardRect = boardEl.getBoundingClientRect();
  const effect = document.createElement("div");
  effect.className = `keyword-summon-effect ${visibleKeywords.map((keyword) => `kw-${keyword}`).join(" ")}`;
  effect.setAttribute("aria-hidden", "true");
  effect.innerHTML = visibleKeywords
    .map((keyword) => `<span class="keyword-summon-icon keyword-summon-icon-${keyword}">${keywordIconHTML(keyword)}</span>`)
    .join("");
  effect.style.left = `${targetRect.left - boardRect.left + targetRect.width / 2}px`;
  effect.style.top = `${targetRect.top - boardRect.top + targetRect.height / 2}px`;
  boardEl.appendChild(effect);
  setTimeout(() => effect.remove(), 1150);
  return true;
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

function flashSpecialAbilityBadge(instanceId) {
  const badge = findCardElement(instanceId)?.querySelector(".special-ability-badge");
  if (!badge) return false;
  badge.classList.remove("is-activating");
  void badge.offsetWidth;
  badge.classList.add("is-activating");
  setTimeout(() => badge.classList.remove("is-activating"), 900);
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
    if (!nextM) return; // died - handled by animateDeaths
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

function resetBattleRevealQueue() {
  battleRevealGeneration += 1;
  battleRevealTail = Promise.resolve();
  activeBattleReveal = null;
  document.querySelector(".spell-cast-reveal")?.remove();
}

function queueBattleReveal(revealFactory) {
  const generation = battleRevealGeneration;
  const reveal = battleRevealTail
    .catch(() => {})
    .then(() => {
      if (generation !== battleRevealGeneration) return null;
      return revealFactory();
    })
    .catch(() => {});
  activeBattleReveal = reveal;
  battleRevealTail = reveal.finally(() => {
    if (activeBattleReveal === reveal) activeBattleReveal = null;
  });
  return reveal;
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
  if (!card || card.type !== "minion" || !["legendary", "mythic"].includes(card.rarity)) return Promise.resolve();

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
  const pendingSpecialActivations = [];

  if (next.lastAction && next.lastAction.type === "attack" && next.lastAction.seq > lastAnimatedActionSeq) {
    lastAnimatedActionSeq = next.lastAction.seq;
    if (animateAttackLunge(prev, next.lastAction)) anyImpact = true;
  }

  (next.specialAbilityActivations || []).forEach((activation) => {
    if (!activation?.seq || activation.seq <= lastAnimatedSpecialAbilitySeq) return;
    lastAnimatedSpecialAbilitySeq = Math.max(lastAnimatedSpecialAbilitySeq, activation.seq);
    if (activation.handReveal) showHandStealReveal(activation.handReveal);
    if (flashSpecialAbilityBadge(activation.instanceId)) {
      anyImpact = true;
    } else {
      pendingSpecialActivations.push(activation);
    }
  });

  if (diffAndFlashHero(prev.me, next.me, $("selfHero"))) anyImpact = true;
  if (diffAndFlashHero(prev.opponent, next.opponent, $("oppHero"))) anyImpact = true;

  if (diffAndFlashBoard(prev.me.board, next.me.board)) anyImpact = true;
  if (diffAndFlashBoard(prev.opponent.board, next.opponent.board)) anyImpact = true;

  if (animateDeaths(prev.me.board, next.me.board)) anyImpact = true;
  if (animateDeaths(prev.opponent.board, next.opponent.board)) anyImpact = true;

  if (anyDamageTaken(prev, next)) playDamageSfx();

  const prevIds = new Set([...prev.me.board, ...prev.opponent.board].map((m) => m.instanceId));
  const newMinions = [
    ...next.me.board.map((m) => ({ id: m.instanceId, cardId: m.cardId, isSelf: true, keywords: activeKeywords(m).filter((keyword) => KEYWORD_SUMMON_EFFECT_ORDER.includes(keyword)) })),
    ...next.opponent.board.map((m) => ({ id: m.instanceId, cardId: m.cardId, isSelf: false, keywords: activeKeywords(m).filter((keyword) => KEYWORD_SUMMON_EFFECT_ORDER.includes(keyword)) })),
  ].filter((m) => !prevIds.has(m.id));
  const enemySummoned = next.opponent.board.some((m) => !prevIds.has(m.instanceId));
  if (enemySummoned) window.ArcaneAudio?.playSfx("cardPlay");

  return { anyImpact, newMinions, pendingSpecialActivations };
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
  hideHandStealReveal();
  const screenIds = ["auth", "enter", "menu", "lobby", "inventory", "shop", "trade", "profile", "game"];
  const loading = $("loadingScreen");
  const currentScreen = screenIds
    .map((screen) => $(`screen-${screen}`))
    .find((screen) => screen && !screen.classList.contains("hidden"));
  const incomingScreen = $(`screen-${name}`);
  const interfaceScreenIds = [
    "screen-enter",
    "screen-menu",
    "screen-lobby",
    "screen-inventory",
    "screen-shop",
    "screen-trade",
    "screen-profile",
  ];
  const isInterfaceTransition =
    currentScreen &&
    incomingScreen &&
    interfaceScreenIds.includes(currentScreen.id) &&
    interfaceScreenIds.includes(incomingScreen.id);

  // Internal navigation is already loaded. Preserve the cinematic screen
  // transitions and reserve the loading seal for auth and real match setup.
  if (isInterfaceTransition) {
    clearTimeout(screenTransitionTimer);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const compactMotion = window.matchMedia?.("(max-width: 760px)")?.matches;
    const swapDelay = reduceMotion ? 0 : compactMotion ? 50 : 80;
    const enterDuration = reduceMotion ? 0 : compactMotion ? 120 : 180;
    currentScreen.classList.add("screen-transition-out");
    screenTransitionTimer = setTimeout(() => {
      screenIds.forEach((screen) => {
        const el = $(`screen-${screen}`);
        if (el) el.classList.toggle("hidden", name !== screen);
      });
      currentScreen.classList.remove("screen-transition-out");
      incomingScreen.classList.add("screen-transition-in");
      window.ArcaneAudio?.onScreenChange(name);
      screenTransitionTimer = setTimeout(() => {
        incomingScreen.classList.remove("screen-transition-in");
      }, enterDuration);
    }, swapDelay);
    return;
  }

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
  $("screen-lobby").classList.toggle("lobby-multiplayer", mode === "multiplayer");
  $("lobbyEmbers").classList.toggle("hidden", !["singleplayer", "multiplayer"].includes(mode));
  $("singleplayerActions").classList.toggle("hidden", mode !== "singleplayer");
  $("multiplayerActions").classList.toggle("hidden", mode !== "multiplayer");
  $("lobbyKicker").textContent = mode === "singleplayer" ? "Choose your path" : "Enter the arena";
  $("lobbySubtitle").textContent =
    mode === "singleplayer"
      ? "Practice against the NPC or play a Campaign for rewards"
      : "Online 1v1 - create a room or join one with a code";
  $("roomInfo").classList.add("hidden");
  $("lobbyError").classList.add("hidden");
  $("onlinePlayerCount").classList.toggle("hidden", mode !== "multiplayer");
  if (mode === "multiplayer") {
    $("lobbySubtitle").textContent = "Online 1v1 - find a match or use a room code";
    setLobbyTab("quickplay");
    loadOnlinePlayerCount();
    void loadRankedStatus();
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
    showToast(`${tile.dataset.lockedName} isn't available yet - coming soon.`);
  });
});

$("btnBackToMenu").addEventListener("click", () => {
  setSingleplayerStartPending(false);
  send("cancelTournamentMatch", {});
  window.ArcaneTournaments?.setVisible(false);
  switchScreen("menu");
});

// ---------------- LOBBY ----------------

function setLobbyTab(tab) {
  const isQuickplay = tab === "quickplay";
  const isRoomCode = tab === "room";
  const isRanked = tab === "ranked";
  $("tabRoomCode").classList.toggle("active", isRoomCode);
  $("tabQuickplay").classList.toggle("active", isQuickplay);
  $("tabRanked").classList.toggle("active", isRanked);
  $("roomCodePanel").classList.toggle("hidden", !isRoomCode);
  $("quickplayPanel").classList.toggle("hidden", !isQuickplay);
  $("rankedPanel").classList.toggle("hidden", !isRanked);
  $("roomInfo").classList.add("hidden");
  window.ArcaneTournaments?.setVisible(false);
  if (isRanked) loadRankedStatus();
}

let rankedSearching = false;
let rankedStatusTimer = null;
let rankedWindowOpen = false;
let rankedRewardState = null;
let rankedRewardTiers = [];
let rankedStatusPromise = null;
let rankedStatusCache = null;
let rankedStatusCacheAt = 0;
function setRankedSearching(searching) {
  rankedSearching = searching;
  $("btnRanked")?.classList.toggle("hidden", searching);
  $("btnCancelRanked")?.classList.toggle("hidden", !searching);
  if ($("rankedStatus") && searching) $("rankedStatus").textContent = "Searching for a ranked opponent...";
  updateGlobalMatchSearchStatus();
}
function setRankedAvailability(open) {
  rankedWindowOpen = open;
  const button = $("btnRanked");
  if (!button || rankedSearching) return;
  button.disabled = !open;
  button.setAttribute("aria-disabled", String(!open));
  button.textContent = open ? "Find ranked match" : "Ranked closed";
  button.classList.toggle("ranked-closed-button", !open);
  button.title = open ? "Find a ranked opponent" : "Ranked is outside its scheduled CET window";
  if ($("rankedStatus")) $("rankedStatus").textContent = open
    ? "Matchmaking only with ranked players."
    : "Ranked is closed. Search is available during the scheduled window.";
}

function setRankedRewardsModalOpen(open) {
  const modal = $("rankedRewardsModal");
  if (!modal) return;
  modal.classList.toggle("hidden", !open);
  if (open) {
    renderRankedRewards();
    void loadRankedStatus();
  }
}

function renderRankedRewards() {
  const list = $("rankedRewardsList");
  const status = $("rankedRewardsStatus");
  const claimButton = $("btnClaimRankedReward");
  if (!list || !status || !claimButton) return;
  const reward = rankedRewardState || {};
  const currentRank = normalizeRankDisplay(reward.currentRank);
  const claimed = Boolean(reward.claimed);
  const currentRewardGold = Number(reward.currentRewardGold || 0);
  list.innerHTML = (rankedRewardTiers || []).map((rank) => {
    const visibleRank = normalizeRankDisplay(rank);
    const isCurrent = visibleRank.id === currentRank.id;
    const isClaimed = claimed && reward.claimedRankId === visibleRank.id;
    return `<div class="ranked-reward-row ${isCurrent ? "is-current" : ""} ${isClaimed ? "is-claimed" : ""}" style="--rank-color:${escapeHtmlAttr(visibleRank.color || "#8ddcff")}"><span class="ranked-reward-rank"><span class="ranked-reward-icon">${rankIconMarkup(visibleRank)}</span><strong>${escapeHtml(visibleRank.name || "Sand")}</strong></span><span class="ranked-reward-gold">${Number(visibleRank.rewardGold || 0)} gold</span></div>`;
  }).join("");
  claimButton.disabled = claimed || currentRewardGold <= 0;
  claimButton.setAttribute("aria-disabled", String(claimButton.disabled));
  claimButton.textContent = claimed ? "Claimed this week" : currentRewardGold > 0 ? `Claim ${currentRewardGold} gold` : "No reward";
  status.textContent = claimed
    ? `This week's ${reward.claimedRewardGold || 0} gold reward was already claimed.`
    : currentRewardGold > 0
      ? `Current rank: ${currentRank.name}. Claimable this week: ${currentRewardGold} gold.`
      : "Sand has no weekly gold reward. Climb to Bronze or higher to claim.";
}

function applyRankedStatus(data) {
  const current = data.current || {};
  rankedRewardState = data.reward || null;
  rankedRewardTiers = Array.isArray(data.ranks) ? data.ranks : [];
  setRankedAvailability(Boolean(data.window?.open));
  const currentRank = normalizeRankDisplay(current.rank);
  $("rankedCurrent").innerHTML = `<span class="ranked-emblem" style="--rank-color:${escapeHtmlAttr(currentRank?.color || "#8ddcff")}">${rankIconMarkup(currentRank)}</span><strong>${escapeHtml(currentRank?.name || "Sand")}</strong><span>${Number(current.rating || 0)} rating</span>`;
  const rankedStart = data.window?.startsAt ? new Date(data.window.startsAt) : null;
  const localStart = rankedStart && !Number.isNaN(rankedStart.getTime())
    ? new Intl.DateTimeFormat(undefined, { weekday:"short", hour:"numeric", minute:"2-digit" }).format(rankedStart)
    : "Unavailable";
  $("rankedLocalTime").textContent = data.window?.open
    ? `Ranked is open now | Started at ${localStart} (your local time)`
    : `Starts at ${localStart} (your local time)`;
  $("rankedRanks").innerHTML = (data.ranks || []).map((rank) => {
    const visibleRank = normalizeRankDisplay(rank);
    return `<span class="ranked-tier" style="--rank-color:${escapeHtmlAttr(visibleRank.color)}"><b>${rankIconMarkup(visibleRank)}</b>${escapeHtml(visibleRank.name)}<small>${visibleRank.min}+ | ${Number(visibleRank.rewardGold || 0)}g</small></span>`;
  }).join("");
  renderRankedRewards();
  clearInterval(rankedStatusTimer);
  const updateCountdown = () => {
    const window = data.window || {};
    const target = window.open ? new Date(window.endsAt) : new Date(window.startsAt);
    const seconds = Math.max(0, Math.floor((target - Date.now()) / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const label = window.open ? "Ranked ends in" : "Ranked starts in";
    $("rankedCountdown").textContent = label + " " + hours + "h " + minutes + "m";
    const seasonTarget = data.season?.endsAt ? new Date(data.season.endsAt) : null;
    if ($("rankedSeasonCountdown") && seasonTarget && !Number.isNaN(seasonTarget.getTime())) {
      const seasonSeconds = Math.max(0, Math.floor((seasonTarget - Date.now()) / 1000));
      const seasonDays = Math.floor(seasonSeconds / 86400);
      const seasonHours = Math.floor((seasonSeconds % 86400) / 3600);
      const seasonMinutes = Math.floor((seasonSeconds % 3600) / 60);
      $("rankedSeasonCountdown").textContent = `Ranked season ends in ${seasonDays}d ${seasonHours}h ${seasonMinutes}m`;
    }
    if (target <= Date.now()) void loadRankedStatus({ force: true });
  };
  updateCountdown();
  rankedStatusTimer = setInterval(updateCountdown, 30000);
}

async function loadRankedStatus({ force = false } = {}) {
  const cacheFresh = rankedStatusCache && Date.now() - rankedStatusCacheAt < 15000;
  if (!force && cacheFresh) {
    applyRankedStatus(rankedStatusCache);
    return rankedStatusCache;
  }
  if (rankedStatusPromise) return rankedStatusPromise;
  rankedStatusPromise = (async () => {
    try {
      const response = await apiFetch("/ranking/ranked");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load ranked status.");
      rankedStatusCache = data;
      rankedStatusCacheAt = Date.now();
      applyRankedStatus(data);
      return data;
    } catch (err) {
      setRankedAvailability(false);
      if ($("rankedStatus")) $("rankedStatus").textContent = err.message;
      return null;
    } finally {
      rankedStatusPromise = null;
    }
  })();
  return rankedStatusPromise;
}

async function claimRankedReward() {
  const button = $("btnClaimRankedReward");
  if (button?.disabled) return;
  if (button) {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Claiming...";
  }
  try {
    const response = await apiFetch("/ranking/ranked/reward", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not claim ranked reward.");
    rankedRewardState = data.reward || rankedRewardState;
    if (data.user) updateAccountDisplay(data.user);
    renderRankedRewards();
    if (data.reward?.goldAwarded > 0) showToast(`Ranked reward: +${data.reward.goldAwarded} gold.`);
    else showToast(data.reward?.reason || "Ranked reward already claimed this week.");
    void loadRankedStatus();
  } catch (err) {
    showToast(err.message || "Could not claim ranked reward.");
    renderRankedRewards();
  } finally {
    if (button) button.removeAttribute("aria-busy");
  }
}

function rankingRowHTML(player, view = quickplayRankingView) {
  const rank = Number(player?.rank) || 0;
  const wins = Number(player?.wins) || 0;
  const ranked = normalizeRankedDisplay(player?.ranked);
  const visibleRank = normalizeRankDisplay(ranked.rank);
  const value = view === "ranked" ? Number(ranked.rating || 0) : wins;
  const name = escapeHtml(player?.username || "Player");
  const avatar = player?.avatarUrl
    ? `<img class="ranking-avatar" src="${escapeHtmlAttr(player.avatarUrl)}" alt="" />`
    : `<span class="ranking-avatar ranking-avatar-empty" aria-hidden="true"></span>`;
  const rankIcon = `<span class="ranking-rank-icon" style="--rank-color:${escapeHtmlAttr(visibleRank.color || "#8ddcff")}" title="${escapeHtmlAttr(visibleRank.name || "Sand")}">${rankIconMarkup(visibleRank)}</span>`;
  return `<li class="ranking-row"><span class="ranking-rank">#${rank}</span><span class="ranking-player">${avatar}${rankIcon}<span class="ranking-name">${name}</span></span><span class="ranking-wins">${value}</span></li>`;
}

function setQuickplayRankingView(view, { reload = true } = {}) {
  quickplayRankingView = view === "ranked" ? "ranked" : "wins";
  document.querySelectorAll("[data-ranking-view]").forEach((button) => {
    const active = button.dataset.rankingView === quickplayRankingView;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  const valueHeader = $("rankingValueHeader");
  if (valueHeader) valueHeader.textContent = quickplayRankingView === "ranked" ? "Rating" : "Wins";
  if (reload) void loadQuickplayRanking(quickplayRankingView);
}

async function loadQuickplayRanking(view = quickplayRankingView) {
  const list = $("rankingList");
  const current = $("rankingCurrentPlayer");
  if (!list || !current) return;
  const rankingView = view === "ranked" ? "ranked" : "wins";
  const loadSeq = ++quickplayRankingLoadSeq;
  list.innerHTML = '<li class="ranking-empty">Loading ranking...</li>';
  current.classList.add("hidden");

  try {
    const res = await apiFetch(`/ranking/quickplay?view=${encodeURIComponent(rankingView)}`);
    const data = await res.json();
    if (loadSeq !== quickplayRankingLoadSeq) return;
    if (!res.ok) throw new Error(data.error || "Could not load the quickplay ranking.");
    const players = Array.isArray(data.players) ? data.players : [];
    list.innerHTML = players.length > 0
      ? players.map((player) => rankingRowHTML(player, rankingView)).join("")
      : `<li class="ranking-empty">${rankingView === "ranked" ? "No ranked players yet." : "No victories yet."}</li>`;
    if (data.currentPlayer) {
      current.innerHTML = rankingRowHTML(data.currentPlayer, rankingView);
      current.classList.remove("hidden");
    }
  } catch (err) {
    if (loadSeq !== quickplayRankingLoadSeq) return;
    list.innerHTML = `<li class="ranking-empty">${escapeHtml(err.message || "Could not load the quickplay ranking.")}</li>`;
  }
}

function setQuickplayRankingModalOpen(open, view = null) {
  const modal = $("quickplayRankingModal");
  if (!modal) return;
  modal.classList.toggle("hidden", !open);
  if (open) {
    if (view) quickplayRankingView = view === "ranked" ? "ranked" : "wins";
    setQuickplayRankingView(quickplayRankingView, { reload: false });
    void loadQuickplayRanking(quickplayRankingView);
  }
}

function setQuickplaySearching(searching) {
  quickplaySearching = searching;
  $("btnQuickplay").classList.toggle("hidden", searching);
  $("btnCancelQuickplay").classList.toggle("hidden", !searching);
  $("quickplayStatus").classList.toggle("searching", searching);
  $("quickplayStatus").textContent = searching ? "Searching for an opponent" : "Queue for a basic online 1v1 match.";
  updateGlobalMatchSearchStatus();
}

function updateGlobalMatchSearchStatus() {
  const status = $("globalMatchSearchStatus");
  if (!status) return;
  const searching = quickplaySearching || rankedSearching;
  status.classList.toggle("hidden", !searching);
  const mode = rankedSearching ? "Ranked" : "Quickplay";
  status.title = searching ? `Cancel ${mode} search` : "";
  status.setAttribute("aria-label", searching ? `Cancel ${mode} search` : "Match search");
  const text = $("globalMatchSearchText");
  if (text) text.textContent = "Buscando";
}

function cancelActiveMatchSearch() {
  const wasQuickplaySearching = quickplaySearching;
  const wasRankedSearching = rankedSearching;
  setQuickplaySearching(false);
  setRankedSearching(false);
  if (wasQuickplaySearching) send("cancelQuickplay", {});
  if (wasRankedSearching) send("cancelRanked", {});
}

function setSingleplayerStartPending(pending) {
  singleplayerStartPending = pending;
  const button = $("btnStartSingle");
  if (!button) return;
  button.disabled = pending;
  button.setAttribute("aria-busy", pending ? "true" : "false");
  const subtitle = button.querySelector(".singleplayer-mode-subtitle");
  if (subtitle) {
    subtitle.textContent = pending
      ? "Preparing your opponent and the battlefield..."
      : "Enter Fastplay with your active deck and earn daily gold.";
  }
}

$("tabRoomCode").addEventListener("click", () => setLobbyTab("room"));
$("tabQuickplay").addEventListener("click", () => setLobbyTab("quickplay"));
$("tabRanked").addEventListener("click", () => setLobbyTab("ranked"));

$("btnCreate").addEventListener("click", () => {
  if (!requireLoggedInForPlay()) return;
  cancelActiveMatchSearch();
  setSingleplayerStartPending(false);
  connect(() => send("createRoom", {}));
});

$("btnJoin").addEventListener("click", () => {
  if (!requireLoggedInForPlay()) return;
  const roomCode = $("joinCode").value.trim();
  if (!roomCode) return showToast("Enter a room code.");
  cancelActiveMatchSearch();
  setSingleplayerStartPending(false);
  connect(() => send("joinRoom", { roomCode }));
});

$("btnQuickplay").addEventListener("click", () => {
  if (!requireLoggedInForPlay()) return;
  if (rankedSearching) cancelActiveMatchSearch();
  setQuickplaySearching(true);
  setSingleplayerStartPending(false);
  connect(() => send("quickplay", {})).catch(() => setQuickplaySearching(false));
});

$("btnCancelQuickplay").addEventListener("click", () => {
  cancelActiveMatchSearch();
});
$("btnOpenQuickplayRanking").addEventListener("click", () => setQuickplayRankingModalOpen(true, "wins"));
$("btnCloseQuickplayRanking").addEventListener("click", () => setQuickplayRankingModalOpen(false));
$("rankingViewWins").addEventListener("click", () => setQuickplayRankingView("wins"));
$("rankingViewRanked").addEventListener("click", () => setQuickplayRankingView("ranked"));
$("quickplayRankingModal").addEventListener("click", (event) => {
  if (event.target.id === "quickplayRankingModal") setQuickplayRankingModalOpen(false);
});
$("btnRankedRewards").addEventListener("click", () => setRankedRewardsModalOpen(true));
$("btnOpenRankedRanking").addEventListener("click", () => setQuickplayRankingModalOpen(true, "ranked"));
$("btnCloseRankedRewards").addEventListener("click", () => setRankedRewardsModalOpen(false));
$("rankedRewardsModal").addEventListener("click", (event) => {
  if (event.target.id === "rankedRewardsModal") setRankedRewardsModalOpen(false);
});
$("btnClaimRankedReward").addEventListener("click", claimRankedReward);
$("btnRanked").addEventListener("click", () => {
  if (!rankedWindowOpen) return showToast("Ranked is currently closed.");
  if (!requireLoggedInForPlay()) return;
  if (quickplaySearching) cancelActiveMatchSearch();
  setRankedSearching(true);
  connect(() => send("ranked", {})).catch(() => setRankedSearching(false));
});
$("btnCancelRanked").addEventListener("click", cancelActiveMatchSearch);
$("globalMatchSearchStatus").addEventListener("click", cancelActiveMatchSearch);

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
    const campaigns = data.campaigns || [];
    activeCampaignStage = campaigns[0] || null;
    if (!activeCampaignStage) throw new Error("No campaign stages are available.");
    renderCampaignStageList(campaigns);
    selectCampaignStage(activeCampaignStage, 0);
    document.querySelector(".singleplayer-mode-grid").classList.add("hidden");
    $("campaignStagePanel").classList.remove("hidden");
  } catch (err) {
    showToast(err.message);
  }
}

function selectCampaignStage(campaign, index) {
  activeCampaignStage = campaign;
  const unavailable = campaign.available === false;
  const locked = !unavailable && (campaign.locked === true || campaign.unlocked === false);
  const completed = Number(campaign.wins || 0) > 0;
  const statusText = unavailable ? "Coming soon" : locked ? "Locked" : completed ? "Complete" : "Available";
  $("campaignStageLabel").textContent = `Stage ${index + 1}`;
  const status = $("campaignStageStatus");
  status.textContent = statusText;
  status.dataset.state = unavailable ? "unavailable" : locked ? "locked" : completed ? "complete" : "available";
  $("campaignStageName").textContent = campaign.name;
  $("campaignStageLore").textContent = locked
    ? campaign.lockReason || "Complete the previous stage first."
    : campaign.lore;
  $("btnStartCampaignStage").disabled = unavailable || locked;
  $("btnStartCampaignStage").textContent = unavailable
    ? "Coming soon"
    : locked
      ? "Complete previous stage"
    : `Challenge ${campaign.npcName || campaign.name}`;
  const campaignInfo = $("btnCampaignInfo");
  const hasGoldReward = Number(campaign.rewardGold || 0) > 0;
  campaignInfo.setAttribute("aria-label", hasGoldReward ? "View campaign rewards" : "View campaign card progress");
  campaignInfo.title = hasGoldReward ? "View campaign rewards" : "View card progress";
  document.querySelectorAll(".campaign-stage-choice").forEach((button) => {
    button.classList.toggle("active", button.dataset.campaignId === campaign.id);
    button.setAttribute("aria-selected", button.dataset.campaignId === campaign.id ? "true" : "false");
  });
}

function renderCampaignStageList(campaigns) {
  const list = $("campaignStageList");
  list.innerHTML = "";
  campaigns.forEach((campaign, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "campaign-stage-choice";
    button.dataset.campaignId = campaign.id;
    button.setAttribute("role", "listitem");
    const unavailable = campaign.available === false;
    const locked = !unavailable && (campaign.locked === true || campaign.unlocked === false);
    const completed = Number(campaign.wins || 0) > 0;
    const statusText = unavailable ? "Soon" : locked ? "Locked" : completed ? "Done" : "Open";
    button.dataset.state = unavailable ? "unavailable" : locked ? "locked" : completed ? "complete" : "available";
    button.innerHTML = `
      <span class="campaign-stage-choice-index">Stage ${index + 1}</span>
      <span class="campaign-stage-choice-name">${escapeHtml(campaign.name)}</span>
      <span class="campaign-stage-choice-state">${statusText}</span>
    `;
    button.addEventListener("click", () => selectCampaignStage(campaign, index));
    if (unavailable) {
      button.classList.add("locked");
      button.title = "This campaign is not available yet.";
    } else if (locked) {
      button.classList.add("locked");
      button.title = campaign.lockReason || "Complete the previous stage first.";
    }
    list.appendChild(button);
  });
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
    rewardGold: activeCampaignStage.rewardGold,
    rewardGoldOnce: activeCampaignStage.rewardGoldOnce,
    goldRewardClaimed: activeCampaignStage.goldRewardClaimed,
  });
});

$("btnStartCampaignStage").addEventListener("click", () => {
  if (!activeCampaignStage || !requireLoggedInForPlay()) return;
  if (activeCampaignStage.locked === true || activeCampaignStage.unlocked === false) {
    return showToast(activeCampaignStage.lockReason || "Complete the previous stage first.");
  }
  setSingleplayerStartPending(false);
  cancelActiveMatchSearch();
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
  // possibly the one currently under the cursor/finger - hide any open
  // tooltip first, since its mouseleave will never fire on a node that
  // no longer exists.
  hideCardTooltip();
  const gameScreen = $("screen-game");
  if (state.campaignTheme) gameScreen.dataset.campaignTheme = state.campaignTheme;
  else delete gameScreen.dataset.campaignTheme;
  if (state.campaignBoardMusic) window.ArcaneAudio?.playMusic(state.campaignBoardMusic);
  if (state.tournament && state.winner === null && $("matchStatus")?.classList.contains("hidden")) {
    setMatchStatus("Tournament match | 30 seconds per turn");
  }
  if (!state.tournament && !$("matchStatus")?.classList.contains("warning")) clearMatchStatus();

  // Heroes
  $("selfName").textContent = state.me.name;
  setHeroAvatar($("selfAvatar"), state.me);
  $("selfHealth").textContent = state.me.health;
  $("selfMana").textContent = state.me.manaCurrent;
  $("selfManaMax").textContent = state.me.manaMax;
  $("selfHeroStatuses").innerHTML = statusBadgesHTML(state.me);
  $("selfDeckCount").textContent = state.me.deckCount + " 🂠";

  $("oppName").textContent = state.opponent.name;
  setHeroAvatar($("oppAvatar"), state.opponent);
  $("oppHealth").textContent = state.opponent.health;
  $("oppMana").textContent = state.opponent.manaCurrent;
  $("oppManaMax").textContent = state.opponent.manaMax;
  $("oppHeroStatuses").innerHTML = statusBadgesHTML(state.opponent);
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
  renderMulligan(state);

  // End turn button
  updateEndTurnButtonState(state);

  updateTargetableHighlights(state);
}

function updateEndTurnButtonState(state) {
  const button = $("btnEndTurn");
  const disabled = !state.isYourTurn || Boolean(state.mulligan?.active);
  const hasActions = !disabled && playerHasAvailableActions(state);
  button.disabled = disabled;
  button.classList.remove("action-pending", "has-actions", "no-actions");
  if (!disabled) button.classList.add(hasActions ? "has-actions" : "no-actions");
}

function renderTurnTimer(state) {
  const timer = $("turnTimer");
  if (!timer) return;
  clearInterval(turnTimerInterval);
  turnTimerInterval = null;
  turnClockOffsetMs = Number.isFinite(state.serverNow) ? state.serverNow - Date.now() : 0;

  if (state.matchPausedForReconnect) {
    timer.textContent = "Paused - reconnecting";
    timer.classList.add("turn-timer-warning");
    return;
  }

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
      ${specialAbilityBadgeHTML(minion)}
      <div class="card-badges">${keywordBadgesHTML(minion)}</div>
      <div class="card-status-badges">${statusBadgesHTML(minion)}</div>
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
  if (isSelf && (!minion.canAttack || (minion.attack || 0) <= 0)) classNames.push("exhausted");
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
  renderHandResourcePips(container, state);
  state.me.hand.forEach((card, idx) => {
    const el = document.createElement("div");
    el.className = `hand-card ${rarityClass(card)}`;
    const fanOffset = idx - (handCount - 1) / 2;
    el.style.setProperty("--hand-angle", `${fanOffset * 3.2}deg`);
    // Lift the outer cards slightly so their rotation never reaches the
    // lower board frame.
    el.style.setProperty("--hand-rest-y", `${-Math.abs(fanOffset) * 5}px`);
    if (card.type === "spell") el.classList.add("spell");
    if (card.cost > state.me.manaCurrent || getHandCardPlayBlockReason(state, card)) el.classList.add("unaffordable");
    if (idx === selectedHandIndex) el.classList.add("selected");
    el.dataset.handIndex = String(idx);

    el.innerHTML = `
      ${cardArtHTML(card)}
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

    el.addEventListener("click", () => onHandCardClick(idx, card, state, el));
    attachCardTooltip(el, card);
    container.appendChild(el);
  });
}

function renderHandResourcePips(container, state) {
  const pips = document.createElement("div");
  pips.className = "hand-resource-pips";
  pips.setAttribute("aria-hidden", "true");
  pips.innerHTML = `
    <span class="hand-resource-pip hand-resource-health" title="Health">
      <span>${state.me.health}</span>
    </span>
    <span class="hand-resource-pip hand-resource-mana" title="Mana">
      <span>${state.me.manaCurrent}/${state.me.manaMax}</span>
    </span>
  `;
  container.appendChild(pips);
}

function mulliganCardHTML(card) {
  return `
    ${cardArtHTML(card)}
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

function compactHandRevealCardHTML(card) {
  const stats = card?.type === "minion"
    ? `<span class="hand-reveal-card-stats">${card.attack}/${card.health}</span>`
    : "";
  return `
    ${cardArtHTML(card)}
    <span class="hand-reveal-card-cost">${card.cost}</span>
    ${stats}
    <span class="hand-reveal-card-name">${escapeHtml(card.name)}</span>
  `;
}

function hideHandStealReveal() {
  clearTimeout(handRevealTimer);
  handRevealTimer = null;
  const overlay = $("handRevealOverlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
  overlay.classList.remove("is-leaving");
  $("handRevealCards")?.replaceChildren();
}

function showHandStealReveal(reveal) {
  const overlay = $("handRevealOverlay");
  const cards = $("handRevealCards");
  if (!overlay || !cards) return;
  const sourceName = reveal?.sourceName || "GrachtViper";
  const stolenCard = reveal?.stolenCard || null;
  $("handRevealTitle").textContent = `${sourceName} stole ${stolenCard?.name || "a card"}`;
  $("handRevealStatus").textContent = stolenCard
    ? stolenCard.type === "minion"
      ? `${stolenCard.name} was discounted, buffed, and added to your hand.`
      : `${stolenCard.name} was discounted and added to your hand.`
    : "The stolen card was added to your hand.";
  cards.replaceChildren();
  (reveal?.cards || []).forEach((card, index) => {
    const item = document.createElement("div");
    item.className = `hand-reveal-card ${rarityClass(card)}${index === reveal.selectedIndex ? " is-stolen" : ""}`;
    item.setAttribute("aria-label", `${card.name}${index === reveal.selectedIndex ? " stolen" : ""}`);
    item.innerHTML = compactHandRevealCardHTML(card);
    cards.appendChild(item);
  });
  overlay.classList.remove("hidden", "is-leaving");
  clearTimeout(handRevealTimer);
  handRevealTimer = setTimeout(() => {
    overlay.classList.add("is-leaving");
    handRevealTimer = setTimeout(hideHandStealReveal, 360);
  }, 2_400);
}

function visibleMulliganHandEntries(state) {
  return (state?.me?.hand || []).reduce((entries, card, handIndex) => {
    if (card?.id === SECOND_PLAYER_MANA_CARD_ID) return entries;
    entries.push({ card, handIndex });
    return entries;
  }, []);
}

function resetMulliganOverlay({ immediate = false } = {}) {
  const overlay = $("mulliganOverlay");
  if (!immediate && overlay?.classList.contains("is-leaving")) return;
  const finishReset = () => {
    overlay?.classList.add("hidden");
    overlay?.classList.remove("is-leaving");
    $("mulliganCards")?.replaceChildren();
  };
  if (mulliganTransitionTimer) {
    clearTimeout(mulliganTransitionTimer);
    mulliganTransitionTimer = null;
  }
  if (!immediate && overlay && !overlay.classList.contains("hidden")) {
    overlay.classList.add("is-leaving");
    mulliganTransitionTimer = setTimeout(() => {
      mulliganTransitionTimer = null;
      finishReset();
    }, 360);
  } else {
    finishReset();
  }
  mulliganRoomCode = null;
  mulliganSelectedIndexes = new Set();
  mulliganReplacementIndexes = null;
  mulliganReplacementState = null;
  mulliganResultShownAt = 0;
  mulliganDeadline = 0;
  mulliganStartsAt = 0;
  mulliganLastServerNow = null;
  if (mulliganRenderTimer) {
    clearTimeout(mulliganRenderTimer);
    mulliganRenderTimer = null;
  }
  if (mulliganTimerInterval) {
    clearInterval(mulliganTimerInterval);
    mulliganTimerInterval = null;
  }
}

function updateMulliganTimer() {
  const timer = $("mulliganTimer");
  if (!timer || !mulliganDeadline) return;
  const remaining = Math.max(0, Math.ceil((mulliganDeadline - (Date.now() + mulliganClockOffsetMs)) / 1_000));
  timer.textContent = String(remaining);
  timer.classList.toggle("warning", remaining <= 5);
}

function updateMulliganReplaceButtonLabel(confirmed = false) {
  const replaceButton = $("btnMulliganReplace");
  if (!replaceButton) return;
  replaceButton.textContent = confirmed ? "Waiting" : (mulliganSelectedIndexes.size > 0 ? "Replace" : "Ready");
}

function revealMulliganReplacement(state, replacementIndexes) {
  const cards = $("mulliganCards");
  const overlay = $("mulliganOverlay");
  if (!cards || !overlay) return;
  overlay.querySelector(".mulligan-panel")?.classList.add("is-confirmed");
  $("mulliganStatus").textContent = replacementIndexes.length > 0
    ? "This is your new opening hand."
    : "You kept your opening hand.";
  const replaceButton = $("btnMulliganReplace");
  replaceButton.disabled = true;
  replaceButton.textContent = "Ready";
  cards.replaceChildren();
  visibleMulliganHandEntries(state).forEach(({ card, handIndex }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mulligan-card minion-card ${rarityClass(card)}`;
    button.dataset.handIndex = String(handIndex);
    button.disabled = true;
    button.setAttribute("aria-label", card.name);
    button.innerHTML = mulliganCardHTML(card);
    attachCardTooltip(button, card);
    cards.appendChild(button);
    if (replacementIndexes.includes(handIndex)) button.classList.add("is-dealt");
  });
  mulliganResultShownAt = Date.now();
}

function renderMulligan(state) {
  const overlay = $("mulliganOverlay");
  if (!overlay) return;
  const mulligan = state.mulligan;
  if (!mulligan?.active) {
    if (mulliganReplacementIndexes) {
      if (mulliganTransitionTimer) return;
      const replacementIndexes = [...mulliganReplacementIndexes];
      mulliganTransitionTimer = setTimeout(() => {
        mulliganTransitionTimer = null;
        mulliganReplacementIndexes = null;
        revealMulliganReplacement(state, replacementIndexes);
        mulliganTransitionTimer = setTimeout(() => {
          mulliganTransitionTimer = null;
          resetMulliganOverlay();
        }, 1_250);
      }, 360);
      return;
    }
    const resultDisplayRemaining = Math.max(0, 1_250 - (Date.now() - mulliganResultShownAt));
    if (mulliganResultShownAt && resultDisplayRemaining > 0) {
      if (!mulliganTransitionTimer) {
        mulliganTransitionTimer = setTimeout(() => {
          mulliganTransitionTimer = null;
          resetMulliganOverlay();
        }, resultDisplayRemaining);
      }
      return;
    }
    resetMulliganOverlay();
    return;
  }

  if (mulliganRoomCode !== state.roomCode) {
    if (mulliganTransitionTimer) {
      clearTimeout(mulliganTransitionTimer);
      mulliganTransitionTimer = null;
    }
    mulliganRoomCode = state.roomCode;
    mulliganSelectedIndexes = new Set();
    mulliganLastServerNow = null;
  }

  const incomingServerNow = Number.isFinite(state.serverNow) ? state.serverNow : null;
  if (incomingServerNow !== null && incomingServerNow !== mulliganLastServerNow) {
    mulliganClockOffsetMs = incomingServerNow - Date.now();
    mulliganLastServerNow = incomingServerNow;
  }
  mulliganStartsAt = Number(mulligan.startsAt) || 0;
  mulliganDeadline = Number(mulligan.deadline) || 0;
  const now = Date.now() + mulliganClockOffsetMs;
  const introVisible = !$("matchIntro")?.classList.contains("hidden");
  if (mulliganStartsAt && now < mulliganStartsAt && introVisible) {
    overlay.classList.add("hidden");
    if (!mulliganRenderTimer) {
      const pendingState = state;
      mulliganRenderTimer = setTimeout(() => {
        mulliganRenderTimer = null;
        if (pendingState.mulligan?.active) renderMulligan(pendingState);
      }, Math.max(0, mulliganStartsAt - now));
    }
    return;
  }
  if (mulliganRenderTimer) {
    clearTimeout(mulliganRenderTimer);
    mulliganRenderTimer = null;
  }
  if (!mulliganTimerInterval) mulliganTimerInterval = setInterval(updateMulliganTimer, 250);
  updateMulliganTimer();

  const confirmed = mulligan.confirmed === true;
  const cards = $("mulliganCards");
  overlay.classList.remove("is-leaving");
  overlay.classList.remove("hidden");
  overlay.querySelector(".mulligan-panel")?.classList.toggle("is-confirmed", confirmed);
  $("mulliganMatchup").textContent = `${state.me.name} vs ${state.opponent.name}`;
  $("mulliganStatus").textContent = confirmed
    ? (mulligan.opponentConfirmed ? "Both players are ready." : "Waiting for opponent.")
    : (mulliganSelectedIndexes.size > 0 ? `${mulliganSelectedIndexes.size} selected for replacement.` : "Click cards to replace them.");

  const replaceButton = $("btnMulliganReplace");
  replaceButton.disabled = confirmed;
  updateMulliganReplaceButtonLabel(confirmed);

  if (confirmed && mulliganReplacementIndexes && !mulliganTransitionTimer) {
    mulliganReplacementState = state;
    mulliganTransitionTimer = setTimeout(() => {
      const replacementIndexes = mulliganReplacementIndexes;
      const replacementState = mulliganReplacementState;
      mulliganTransitionTimer = null;
      mulliganReplacementIndexes = null;
      mulliganReplacementState = null;
      if (replacementState?.mulligan?.active) {
        revealMulliganReplacement(replacementState, replacementIndexes);
      }
    }, 360);
    return;
  }
  if (confirmed && mulliganReplacementIndexes) {
    mulliganReplacementState = state;
    return;
  }

  cards.replaceChildren();
  visibleMulliganHandEntries(state).forEach(({ card, handIndex }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mulligan-card minion-card ${rarityClass(card)}${mulliganSelectedIndexes.has(handIndex) ? " selected" : ""}`;
    button.dataset.handIndex = String(handIndex);
    button.disabled = confirmed;
    button.setAttribute("aria-pressed", String(mulliganSelectedIndexes.has(handIndex)));
    button.setAttribute("aria-label", `Toggle ${card.name} replacement`);
    button.innerHTML = mulliganCardHTML(card);
    button.addEventListener("click", () => {
      if (confirmed) return;
      if (mulliganSelectedIndexes.has(handIndex)) mulliganSelectedIndexes.delete(handIndex);
      else mulliganSelectedIndexes.add(handIndex);
      const selected = mulliganSelectedIndexes.has(handIndex);
      button.style.transform = "";
      button.style.zIndex = "";
      const art = button.querySelector(".card-art");
      if (art) art.style.transform = "";
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      $("mulliganStatus").textContent = mulliganSelectedIndexes.size > 0
        ? `${mulliganSelectedIndexes.size} selected for replacement.`
        : "Click cards to replace them.";
      updateMulliganReplaceButtonLabel(false);
    });
    attachCardTooltip(button, card);
    cards.appendChild(button);
  });
}

// ---------------- INTERACTION ----------------

function onHandCardClick(idx, card, state, cardEl = null) {
  if (state.mulligan?.active) return;
  if (!state.isYourTurn) return showToast("It's not your turn.");
  if (card.cost > state.me.manaCurrent) return showToast("Not enough mana.");
  const blockReason = getHandCardPlayBlockReason(state, card);
  if (blockReason) return showToast(blockReason);

  selectedAttackerId = null;

  // Targeted spells remain in hand until a target is chosen. Clicking the
  // selected card again is the quickest, touch-friendly way to cancel it.
  if (selectedHandIndex === idx) {
    clearSelection();
    render(state);
    return;
  }

  const needsPlayTarget = cardRequiresPlayTarget(card);
  const needsEnemyMinionTarget = cardRequiresEnemyMinionTarget(card);
  const needsFriendlyMinionTarget = cardRequiresFriendlyMinionTarget(card);
  const needsMinionTarget = cardRequiresMinionTarget(card);
  const needsEnemyHeroTarget = cardRequiresEnemyHeroTarget(card);
  const enemyOnlyTarget = cardTargetsEnemyOnly(card);
  const optionalEnemyMinionTarget = cardHasOptionalEnemyMinionPlayTarget(card);
  const hasEnemyMinionTarget = (state.opponent?.board || []).length > 0;

  // Minions normally enter the board immediately. A minion with an on-play
  // status effect waits for an enemy target before the server accepts it.
  if (card.type === "minion" && needsEnemyMinionTarget && optionalEnemyMinionTarget && !hasEnemyMinionTarget) {
    selectedHandIndex = null;
    pendingHandPlayAnimation = cardEl
      ? { cardId: card.id, rect: cardEl.getBoundingClientRect(), createdAt: performance.now() }
      : null;
    predictCardPlay(cardEl);
    window.ArcaneAudio?.playSfx("cardPlay");
    send("playCard", { handIndex: idx, targetInstanceId: null });
    return;
  }

  if (card.type === "minion" && !needsPlayTarget) {
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
  if ((card.effect === "draw" || !card.effect) && !needsPlayTarget) {
    selectedHandIndex = null;
    predictCardPlay(cardEl);
    window.ArcaneAudio?.playSfx("cardPlay");
    send("playCard", { handIndex: idx, targetInstanceId: null });
    return;
  }

  // Damage/heal spells and status cards: ask for a target.
  selectedHandIndex = idx;
  collapseHandForSpellTargeting();
  showTargetHint(needsEnemyMinionTarget
    ? "Choose an enemy minion"
    : needsFriendlyMinionTarget
      ? "Choose a friendly minion"
      : needsMinionTarget
        ? "Choose a minion to heal"
        : needsEnemyHeroTarget
          ? "Choose the enemy hero"
          : enemyOnlyTarget
            ? "Choose an enemy minion or the enemy hero"
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
    if (cardRequiresFriendlyMinionTarget(selectedCard) && !isSelf) {
      return showToast("Choose a friendly minion.");
    }
    if (cardRequiresEnemyHeroTarget(selectedCard)) {
      return showToast("Choose the enemy hero.");
    }
    if (cardTargetsEnemyOnly(selectedCard) && isSelf) {
      return showToast("Choose an enemy target.");
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
    if (minionCannotBeAttacked(minion)) return showToast(`${minion.name} cannot be attacked.`);
    window.ArcaneAudio?.playSfx("attack");
    predictAttack(selectedAttackerId, minion.instanceId);
    send("attack", { attackerInstanceId: selectedAttackerId, targetInstanceId: minion.instanceId });
    selectedAttackerId = null;
    return;
  }

  // Case 3: I select one of my own minions to attack with
  if (isSelf) {
    if (!minion.canAttack) return showToast("That minion can't attack yet.");
    if ((minion.attack || 0) <= 0) return showToast("Minions with 0 Attack can't attack.");
    selectedAttackerId = minion.instanceId;
    collapseHandForTargeting();
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
    if (cardRequiresFriendlyMinionTarget(selectedCard)) {
      return showToast("Choose a friendly minion.");
    }
    if (cardRequiresMinionTarget(selectedCard)) {
      return showToast("Choose a minion to heal.");
    }
    if (cardTargetsEnemyOnly(selectedCard) && isSelf) {
      return showToast("Choose an enemy target.");
    }
    if (selectedCard?.effect === "heal" && !isSelf) {
      return showToast("Choose your own hero or a minion to heal.");
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

$("screen-game").addEventListener("click", (event) => {
  if (!isHandTargetingActive()) return;
  const target = closestElement(event.target, ".hand-card, .minion-card, .hero-panel, #targetHint, #btnToggleHand, .turn-actions, button");
  if (target) return;
  clearSelection({ revealHand: true });
  render(myState);
});

$("btnEndTurn").addEventListener("click", () => {
  clearSelection();
  handManualVisibility = null;
  if (isMobileTouchLayout()) setHandCollapsed(true);
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
  if (isHandTargetingActive()) {
    clearSelection({ revealHand: true });
    render(myState);
    return;
  }
  if (shouldForceHideHand(myState)) {
    handManualVisibility = null;
    setHandCollapsed(true);
    return;
  }
  const collapsed = $("screen-game").classList.contains("hand-collapsed");
  handManualVisibility = collapsed ? "shown" : "hidden";
  setHandCollapsed(!collapsed);
});

$("btnMulliganReplace")?.addEventListener("click", () => {
  const button = $("btnMulliganReplace");
  button.disabled = true;
  mulliganReplacementIndexes = [...mulliganSelectedIndexes].sort((left, right) => left - right);
  mulliganReplacementIndexes.forEach((index) => {
    $("mulliganCards")?.querySelector(`[data-hand-index="${index}"]`)?.classList.add("is-replacing");
  });
  $("mulliganStatus").textContent = mulliganReplacementIndexes.length > 0 ? "Replacing selected cards..." : "Keeping this hand...";
  send("replaceOpeningHand", { handIndexes: mulliganReplacementIndexes });
});

function hasPlayableHandCard(state) {
  const mana = Number(state?.me?.manaCurrent);
  return Number.isFinite(mana) && Boolean(state?.me?.hand?.some((card) => Number(card.cost) <= mana && !getHandCardPlayBlockReason(state, card)));
}

function getMaxBoardMinions() {
  if (typeof TCGDeckRules !== "undefined" && Number.isFinite(Number(TCGDeckRules.MAX_BOARD))) {
    return Number(TCGDeckRules.MAX_BOARD);
  }
  return 4;
}

function isOwnBoardFullForHandPlay(state) {
  return Array.isArray(state?.me?.board) && state.me.board.length >= getMaxBoardMinions();
}

function hasReadyAttacker(state) {
  return Boolean(state?.me?.board?.some((minion) => minion.canAttack && (minion.attack || 0) > 0));
}

function playerHasAvailableActions(state) {
  return hasPlayableHandCard(state) || hasReadyAttacker(state);
}

function hasBabuBoardLock(board) {
  return (board || []).some((minion) => minion.cardId === BABU2_CARD_ID);
}

function cardReturnsOtherFriendlyMinionsToHand(card) {
  return Boolean(card?.abilities?.some((ability) => ability.effect === "returnOtherFriendlyMinionsToHand"));
}

function minionBlocksKeywordSummons(minion, keywords = [], context = {}) {
  if ((minion.statuses || []).some((status) => status.type === "silenced")) return false;
  const cardDef = TCGCards.getCardById(minion.cardId);
  return Boolean(cardDef?.abilities?.some((ability) => {
    const hasPlayerContext = Number.isInteger(context.blockerPlayerIdx) && Number.isInteger(context.summonerIdx);
    if (ability.enemyOnly && hasPlayerContext && context.blockerPlayerIdx === context.summonerIdx) return false;
    if (ability.effect === "blockChargeSummons") return keywords.includes("charge");
    if (ability.effect !== "blockKeywordSummons") return false;
    const blocked = Array.isArray(ability.keywords) ? ability.keywords : [];
    return keywords.some((keyword) => blocked.includes(keyword));
  }));
}

function boardKeywordSummonBlocker(card, ...boardEntries) {
  const keywords = card?.type === "minion" ? card.keywords || [] : [];
  if (keywords.length === 0) return null;
  for (const entry of boardEntries) {
    const board = Array.isArray(entry) ? entry : entry?.board;
    const blockerPlayerIdx = Array.isArray(entry) ? null : entry?.playerIdx;
    const summonerIdx = Array.isArray(entry) ? null : entry?.summonerIdx;
    const blocker = (board || []).find((minion) => (
      minionBlocksKeywordSummons(minion, keywords, { blockerPlayerIdx, summonerIdx })
    ));
    if (blocker) return blocker;
  }
  return null;
}

function minionCannotBeAttacked(minion) {
  if ((minion?.statuses || []).some((status) => status.type === "silenced")) return false;
  const cardDef = TCGCards.getCardById(minion?.cardId);
  return Boolean(cardDef?.abilities?.some((ability) => ability.effect === "unattackable"));
}

function getHandCardPlayBlockReason(state, card) {
  if (!state?.me || !card) return "";
  if (card.type === "minion" && hasBabuBoardLock(state.me.board)) {
    return "Babu prevents you from summoning more minions.";
  }
  if (card.type === "minion" && !cardReturnsOtherFriendlyMinionsToHand(card) && isOwnBoardFullForHandPlay(state)) {
    return "Board is full.";
  }
  const keywordBlocker = boardKeywordSummonBlocker(
    card,
    { board: state.me.board, playerIdx: 0, summonerIdx: 0 },
    { board: state.opponent?.board, playerIdx: 1, summonerIdx: 0 },
  );
  if (keywordBlocker) {
    return `${keywordBlocker.name} prevents keyword cards from being summoned.`;
  }
  if (card.type === "minion" && cardReturnsOtherFriendlyMinionsToHand(card)) {
    const handCountAfterPlay = Math.max(0, (state.me.hand || []).length - 1);
    if (handCountAfterPlay + (state.me.board || []).length > 10) {
      return "Not enough hand space.";
    }
  }
  return "";
}

function shouldAutoHideHand(state) {
  return !state || state.winner !== null || !state.isYourTurn || !hasPlayableHandCard(state);
}

function isHandTargetingActive() {
  return selectedHandIndex !== null || selectedAttackerId !== null;
}

function shouldForceHideHand(state) {
  if (!isMobileTouchLayout()) return false;
  return !state || state.winner !== null || isHandTargetingActive();
}

function getMobileAutoHideHandKey(state, turnKey) {
  if (!isMobileTouchLayout() || !state || state.winner !== null || isHandTargetingActive()) return "";
  if (!state.isYourTurn) return `${turnKey}:waiting`;
  if (!hasPlayableHandCard(state)) return `${turnKey}:no-playable-cards`;
  return "";
}

function isMobileTouchLayout() {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse) and (max-width: 900px)").matches;
}

function collapseHandForTargeting() {
  if (!isMobileTouchLayout()) return;
  handManualVisibility = null;
  lastMobileAutoHideKey = null;
  setHandCollapsed(true);
}

function collapseHandForSpellTargeting() {
  collapseHandForTargeting();
}

document.addEventListener("arcana:spell-drag-start", () => {
  collapseHandForSpellTargeting();
});

document.addEventListener("arcana:targeting-start", () => {
  collapseHandForTargeting();
});

document.addEventListener("arcana:spell-drag-end", (event) => {
  if (!event.detail?.played && selectedHandIndex === null) syncHandVisibility(myState);
});

document.addEventListener("arcana:targeting-end", (event) => {
  if (!event.detail?.played && selectedHandIndex === null && selectedAttackerId === null) syncHandVisibility(myState);
});

function setHandCollapsed(collapsed) {
  const gameScreen = $("screen-game");
  const button = $("btnToggleHand");
  gameScreen.classList.remove("hand-preview-open");
  gameScreen.classList.toggle("hand-collapsed", collapsed);
  button.setAttribute("aria-expanded", String(!collapsed));
  button.setAttribute("aria-label", collapsed ? "Show hand" : "Hide hand");
}

function syncHandVisibility(state) {
  if (!state) {
    handManualVisibility = null;
    lastMobileAutoHideKey = null;
    setHandCollapsed(true);
    return;
  }
  const turnKey = `${state.roomCode || "local"}:${state.turnNumber}:${state.turn}`;
  const startsYourTurn = state.isYourTurn && turnKey !== lastHandTurnKey;
  lastHandTurnKey = turnKey;
  $("screen-game").classList.remove("hand-preview-open");
  if (startsYourTurn) {
    handManualVisibility = null;
    lastMobileAutoHideKey = null;
    setHandCollapsed(false);
    return;
  }
  if (shouldForceHideHand(state)) {
    handManualVisibility = null;
    lastMobileAutoHideKey = null;
    setHandCollapsed(true);
    return;
  }
  const mobileAutoHideKey = getMobileAutoHideHandKey(state, turnKey);
  if (mobileAutoHideKey && mobileAutoHideKey !== lastMobileAutoHideKey) {
    lastMobileAutoHideKey = mobileAutoHideKey;
    handManualVisibility = null;
    setHandCollapsed(true);
    return;
  }
  if (!mobileAutoHideKey) {
    lastMobileAutoHideKey = null;
  }
  const selectedCard = selectedHandIndex === null ? null : state.me.hand[selectedHandIndex];
  if (handManualVisibility === "shown" || handManualVisibility === "hidden") {
    setHandCollapsed(handManualVisibility === "hidden");
    return;
  }
  if (isMobileTouchLayout() && selectedCard?.type === "spell" && selectedCard.effect && selectedCard.effect !== "draw") {
    setHandCollapsed(true);
    return;
  }
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
  clearSelection({ revealHand: true });
  render(myState);
});

function clearSelection({ sync = false, revealHand = false } = {}) {
  selectedHandIndex = null;
  selectedAttackerId = null;
  hideTargetHint();
  document.querySelectorAll("#screen-game .selected, #screen-game .targetable").forEach((element) => {
    element.classList.remove("selected", "targetable");
  });
  if (revealHand && myState?.isYourTurn && myState.winner === null && isMobileTouchLayout()) {
    handManualVisibility = "shown";
    lastMobileAutoHideKey = null;
    setHandCollapsed(false);
    return;
  }
  if (sync && myState) syncHandVisibility(myState);
}

function showTargetHint(text) {
  $("targetHint").classList.remove("hidden");
  $("targetHint").firstChild.textContent = text + " - ";
}
function hideTargetHint() {
  $("targetHint").classList.add("hidden");
}

function updateTargetableHighlights(state) {
  const targetingSpell = selectedHandIndex !== null;
  const targetingAttack = selectedAttackerId !== null;
  const selectedCard = targetingSpell ? state.me.hand[selectedHandIndex] : null;
  const enemyMinionOnly = cardRequiresEnemyMinionTarget(selectedCard);
  const friendlyMinionOnly = cardRequiresFriendlyMinionTarget(selectedCard);
  const minionOnly = cardRequiresMinionTarget(selectedCard);
  const enemyHeroOnly = cardRequiresEnemyHeroTarget(selectedCard);
  const enemyOnlyTarget = cardTargetsEnemyOnly(selectedCard);
  const healingSpell = selectedCard?.effect === "heal";

  $("oppHero").classList.toggle("targetable", targetingAttack || (targetingSpell && !enemyMinionOnly && !friendlyMinionOnly && !minionOnly && !healingSpell));
  $("selfHero").classList.toggle("targetable", targetingSpell && !enemyMinionOnly && !friendlyMinionOnly && !minionOnly && !enemyOnlyTarget);

  document.querySelectorAll("#oppBoard .minion-card").forEach((el) => {
    el.classList.toggle("targetable", (targetingSpell && !enemyHeroOnly && !friendlyMinionOnly) || (targetingAttack && !minionCannotBeAttacked(el._minion)));
  });
  document.querySelectorAll("#selfBoard .minion-card").forEach((el) => {
    el.classList.toggle("targetable", targetingSpell && !enemyMinionOnly && !enemyHeroOnly && !enemyOnlyTarget);
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
  const details = [forfeitResultMessage, rewardText].filter(Boolean).join(" - ");
  return details ? `${details} - Press anywhere to return to menu` : "Press anywhere to return to menu";
}

function updateEndRewardText() {
  const reward = $("endReward");
  if (!reward) return;
  if (lastEconomyUpdate) {
    const parts = [];
    if (lastEconomyUpdate.rankedChange) {
      const delta = Number(lastEconomyUpdate.rankedChange.delta || 0);
      const current = Number(lastEconomyUpdate.rankedChange.currentRating || 0);
      const sign = delta > 0 ? "+" : "";
      parts.push(`ELO ${sign}${delta} (current: ${current})`);
    }
    if (lastEconomyUpdate.awardedGold) parts.push(`+${lastEconomyUpdate.awardedGold} gold`);
    if (lastEconomyUpdate.penaltyGold) parts.push(`-${lastEconomyUpdate.penaltyGold} surrender penalty`);
    if (!parts.length) parts.push("Daily reward limit reached");
    reward.textContent = `${parts.join(" | ")} (${lastEconomyUpdate.dailyEarned}/${lastEconomyUpdate.dailyLimit} today)`;
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
  forfeitResultMessage = "";
  setOpponentReconnectPaused(false);
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
// disappears - in hand (where there's no "consumed" state yet) it
// always shows.
function activeKeywords(card) {
  const keywords = [...(card?.keywords || [])];
  if (card?.divineShield === true && !keywords.includes("divineShield")) keywords.push("divineShield");
  return keywords.filter((k) => !(k === "divineShield" && card?.divineShield === false));
}

function keywordBadgesHTML(card) {
  const keywordBadges = activeKeywords(card)
    .map((k) => {
      const label = KEYWORD_FULL_LABEL[k] || k;
      return `<span class="keyword-badge kw-${k}" aria-label="${escapeHtmlAttr(label)}" title="${escapeHtmlAttr(label)}">${keywordIconHTML(k)}</span>`;
    })
    .join("");
  return keywordBadges;
}

function keywordIconHTML(keyword) {
  return KEYWORD_ICON[keyword] || KEYWORD_LABEL[keyword] || "?";
}

function specialAbilityBadgeHTML(card) {
  return cardHasSpecialEffect(card)
    ? '<span class="special-ability-badge" aria-label="Special ability" title="Special ability"><svg class="special-ability-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.7 6.3.8-4.6 4.4 1.2 6.1L12 17l-5.6 3 1.2-6.1L3 9.5l6.3-.8L12 3Z" fill="currentColor"/></svg></span>'
    : "";
}

function cardHasSpecialEffect(card) {
  const cardDef = typeof TCGCards !== "undefined" && card?.cardId ? TCGCards.getCardById(card.cardId) : null;
  const source = cardDef || card;
  if (source?.type !== "minion") return false;
  return Boolean(
    (Array.isArray(source?.abilities) && source.abilities.length > 0) ||
    (Array.isArray(source?.damageBonuses) && source.damageBonuses.length > 0)
  );
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
    case "poisoned": return `Poisoned: takes ${amount} damage at the start of its turn, ${duration}. Can affect minions and heroes; reapplying Poison refreshes it.`;
    case "marked": return `Marked: the next hit deals +${amount} extra damage, then Marked is removed. Expires ${duration}.`;
    case "burning": return `Burning: takes ${amount} damage at the start of its turn, ${duration}. Further Burning adds damage and duration.`;
    case "drunk": return `Drunk: attacks a random minion on either side instead of the chosen target${status.turnsRemaining == null ? "." : `, ${duration}.`}`;
    case "confused": return `Confusion: cannot attack normally ${duration}; has ${amount}% chance to attack an allied minion at turn start.`;
    case "dodge": return `Dodge: has ${amount}% chance to avoid damage.`;
    default: return "Status effect.";
  }
}

function cardRequiresEnemyMinionTarget(card) {
  return Boolean(card?.abilities?.some((ability) =>
    ["applyStatus", "returnEnemyMinionToDeck"].includes(ability.effect) && ability.target === "enemyMinion"
  ));
}

function cardRequiresFriendlyMinionTarget(card) {
  return Boolean(card?.abilities?.some((ability) =>
    ability.effect === "cleanseFriendlyMinion" && ability.target === "friendlyMinion"
  ));
}

function cardRequiresMinionTarget(card) {
  return Boolean(card?.abilities?.some((ability) =>
    (ability.effect === "healTargetMinion" && ability.target === "minion") ||
    (ability.effect === "grantDivineShieldToTargetMinion" && ability.target === "minion")
  ));
}

function cardRequiresEnemyHeroTarget(card) {
  return Boolean(card?.abilities?.some((ability) =>
    ability.effect === "applyStatus" && ability.target === "enemyHero"
  ));
}

function cardHasOptionalEnemyMinionPlayTarget(card) {
  return Boolean(card?.abilities?.some((playAbility) =>
    playAbility.trigger === "onPlay" &&
    playAbility.effect === "applyStatus" &&
    playAbility.target === "enemyMinion" &&
    card.abilities.some((turnAbility) =>
      turnAbility.trigger === "onTurnStart" &&
      turnAbility.effect === "applyStatusToRandomEnemyMinion" &&
      turnAbility.status === playAbility.status
    )
  ));
}

function cardTargetsEnemyOnly(card) {
  return Boolean(card?.abilities?.some((ability) =>
    ability.trigger === "onPlay" &&
    (
      ability.effect === "returnEnemyMinionToDeck" ||
      (ability.effect === "applyStatus" && ["enemyMinion", "enemy", "enemyCharacter", "enemyHero"].includes(ability.target))
    )
  ));
}

function cardRequiresPlayTarget(card) {
  if (!card) return false;
  if (card.type === "spell" && card.effect && card.effect !== "draw") return true;
  return cardTargetsEnemyOnly(card) || cardRequiresFriendlyMinionTarget(card) || cardRequiresMinionTarget(card);
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
  const cardId = card?.cardId || card?.id;
  const catalogCard = typeof TCGCards !== "undefined" && cardId ? TCGCards.getCardById(cardId) : null;
  return `rarity-${catalogCard?.rarity || card?.rarity || "common"}`;
}

function versionedCardArtUrl(src) {
  if (!src || !src.startsWith("art/")) return src;
  return `${src}${src.includes("?") ? "&" : "?"}v=${CARD_ART_ASSET_VERSION}`;
}

// Returns the art layer's HTML: an image if the card has one, or a
// generic icon based on type if it doesn't have art yet.
function cardArtHTML(card, lazy = false) {
  if (card.image) {
    const imageUrl = versionedCardArtUrl(card.image);
    if (lazy) {
      return `<div class="card-art lazy-art" data-src="${escapeHtmlAttr(imageUrl)}"></div>`;
    }
    return `<div class="card-art" style="background-image:url('${escapeHtmlAttr(imageUrl)}')"></div>`;
  }
  const icon = TYPE_ICON[card.type] || "?";
  return `<div class="card-art card-art-placeholder"><span class="card-art-icon">${icon}</span></div>`;
}

function escapeHtmlAttr(str) {
  return String(str).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}

function countryKey(country) {
  return String(country || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function flagRect(x, y, width, height, fill) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"/>`;
}

function flagCircle(cx, cy, radius, fill) {
  return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}"/>`;
}

function flagStar(cx, cy, radius, fill) {
  return `<path d="M ${cx} ${cy - radius} l ${radius * 0.22} ${radius * 0.68} h ${radius * 0.72} l -${radius * 0.58} ${radius * 0.42} l ${radius * 0.22} ${radius * 0.68} l -${radius * 0.58} -${radius * 0.42} l -${radius * 0.58} ${radius * 0.42} l ${radius * 0.22} -${radius * 0.68} l -${radius * 0.58} -${radius * 0.42} h ${radius * 0.72} Z" fill="${fill}"/>`;
}

function weightedOffsets(weights, total) {
  const sum = weights.reduce((acc, value) => acc + value, 0);
  let offset = 0;
  return weights.map((weight) => {
    const size = total * weight / sum;
    const entry = { offset, size };
    offset += size;
    return entry;
  });
}

function countryFlagSvg(code) {
  const design = COUNTRY_FLAG_DESIGN_BY_CODE[code];
  if (!design) return null;
  const w = 48;
  const h = 36;
  let body = "";

  if (design.type === "horizontal") {
    const weights = design.weights || design.colors.map(() => 1);
    weightedOffsets(weights, h).forEach((entry, idx) => {
      body += flagRect(0, entry.offset, w, entry.size, design.colors[idx]);
    });
  } else if (design.type === "vertical") {
    const weights = design.weights || design.colors.map(() => 1);
    weightedOffsets(weights, w).forEach((entry, idx) => {
      body += flagRect(entry.offset, 0, entry.size, h, design.colors[idx]);
    });
  } else if (design.type === "solid") {
    body += flagRect(0, 0, w, h, design.base);
  } else if (design.type === "circle") {
    body += flagRect(0, 0, w, h, design.base);
    body += flagCircle(w / 2, h / 2, 9, design.circle);
  } else if (design.type === "diamond") {
    body += flagRect(0, 0, w, h, design.base);
    body += `<path d="M24 5 L42 18 L24 31 L6 18 Z" fill="${design.diamond}"/>`;
    body += flagCircle(24, 18, 7.2, design.circle);
  } else if (design.type === "nordic") {
    body += flagRect(0, 0, w, h, design.base);
    body += flagRect(13, 0, 7, h, design.cross);
    body += flagRect(0, 14, w, 7, design.cross);
    if (design.inner) {
      body += flagRect(15, 0, 3, h, design.inner);
      body += flagRect(0, 16, w, 3, design.inner);
    }
  } else if (design.type === "triangle") {
    body += flagRect(0, 0, w, h / 2, design.colors[0]);
    body += flagRect(0, h / 2, w, h / 2, design.colors[1]);
    body += `<path d="M0 0 L22 18 L0 36 Z" fill="${design.triangle}"/>`;
    if (design.starColor) body += flagStar(8, 18, 4, design.starColor);
  } else if (design.type === "canton") {
    body += flagRect(0, 0, w, h / 2, design.top);
    body += flagRect(0, h / 2, w, h / 2, design.base);
    body += flagRect(0, 0, 17, 18, design.canton);
    if (design.star) body += flagStar(8.5, 9, 4.2, "#ffffff");
  } else if (design.type === "canton-stripes") {
    for (let i = 0; i < 9; i += 1) body += flagRect(0, i * 4, w, 4, i % 2 === 0 ? "#b22234" : "#ffffff");
    body += flagRect(0, 0, 21, 20, design.canton);
    if (design.moon) {
      body += flagCircle(10, 10, 5, design.moon);
      body += flagCircle(12, 10, 4, design.canton);
    } else {
      body += flagCircle(10, 10, 4, "#ffffff");
    }
  } else if (design.type === "diagonal") {
    body += flagRect(0, 0, w, h, design.a);
    body += `<path d="M0 36 L48 0 L48 36 Z" fill="${design.b}"/>`;
    if (design.border) {
      body += `<path d="M-3 31 L45 -5 L51 1 L3 37 Z" fill="${design.border}"/>`;
      body += `<path d="M-1 33 L47 -3 L49 -1 L1 35 Z" fill="${design.stripe}"/>`;
    } else {
      body += `<path d="M-2 30 L44 -4 L50 2 L4 38 Z" fill="${design.stripe}"/>`;
    }
  } else if (design.type === "oman") {
    body += flagRect(0, 0, w, 12, "#ffffff");
    body += flagRect(0, 12, w, 12, "#db161b");
    body += flagRect(0, 24, w, 12, "#008000");
    body += flagRect(0, 0, 13, h, "#db161b");
  } else if (design.type === "portugal") {
    body += flagRect(0, 0, 19, h, "#006600");
    body += flagRect(19, 0, 29, h, "#ff0000");
    body += flagCircle(19, 18, 5, "#ffcc00");
  } else if (design.type === "south-africa") {
    body += flagRect(0, 0, w, h / 2, "#de3831");
    body += flagRect(0, h / 2, w, h / 2, "#002395");
    body += `<path d="M0 0 L24 18 L0 36 Z" fill="#000000"/>`;
    body += `<path d="M0 4 L18 18 L0 32 L0 26 L11 18 L0 10 Z" fill="#ffb612"/>`;
    body += `<path d="M0 8 L14 18 L0 28 L0 23 L8 18 L0 13 Z" fill="#007a4d"/>`;
    body += flagRect(14, 15, 34, 6, "#007a4d");
  } else if (design.type === "taegeuk") {
    body += flagRect(0, 0, w, h, "#ffffff");
    body += `<path d="M24 9 a9 9 0 0 1 0 18 a4.5 4.5 0 0 0 0 -9 a4.5 4.5 0 0 1 0 -9" fill="#c60c30"/>`;
    body += `<path d="M24 27 a9 9 0 0 1 0 -18 a4.5 4.5 0 0 0 0 9 a4.5 4.5 0 0 1 0 9" fill="#003478"/>`;
  } else if (design.type === "union") {
    body += flagRect(0, 0, w, h, "#012169");
    body += `<path d="M0 0 L48 36 M48 0 L0 36" stroke="#ffffff" stroke-width="8"/>`;
    body += `<path d="M0 0 L48 36 M48 0 L0 36" stroke="#c8102e" stroke-width="4"/>`;
    body += flagRect(19, 0, 10, h, "#ffffff");
    body += flagRect(0, 13, w, 10, "#ffffff");
    body += flagRect(21, 0, 6, h, "#c8102e");
    body += flagRect(0, 15, w, 6, "#c8102e");
  } else if (design.type === "blue-stars") {
    body += flagRect(0, 0, w, h, design.base);
    body += flagStar(32, 10, 3.5, "#cc142b");
    body += flagStar(39, 17, 3.5, "#cc142b");
    body += flagStar(30, 25, 3.5, "#cc142b");
  }

  if (design.emblem === "sun" || design.emblem === "sunRight") body += flagCircle(design.emblem === "sunRight" ? 38 : 24, design.emblem === "sunRight" ? 9 : 18, 3.5, "#f6b40e");
  if (design.emblem === "gold") body += flagCircle(24, 18, 3.5, "#d4af37");
  if (design.emblem === "green") body += flagCircle(24, 18, 3.2, "#2c7a3f");
  if (design.emblem === "stars") {
    [18, 21, 24, 27, 30].forEach((x) => { body += flagStar(x, 18, 1.5, "#0073cf"); });
  }
  if (design.emblem === "checker") {
    body += flagRect(20, 13, 8, 10, "#ffffff");
    body += flagRect(20, 13, 4, 5, "#ff0000");
    body += flagRect(24, 18, 4, 5, "#ff0000");
  }
  if (design.emblem === "wheel") body += flagCircle(24, 18, 4, "#000080");
  if (design.emblem === "starGreen") body += flagStar(24, 18, 7, "#006233");
  if (design.emblem === "cross") {
    body += flagRect(6, 6, 6, 2, "#b0b7bc");
    body += flagRect(8, 4, 2, 6, "#b0b7bc");
  }
  if (design.emblem === "moon") {
    body += flagCircle(12, 10, 4, "#ffffff");
    body += flagCircle(14, 10, 3.2, "#1eb5e5");
  }
  if (design.emblem === "cyprus") {
    body += `<ellipse cx="24" cy="17" rx="8" ry="5" fill="#d57800"/>`;
    body += `<path d="M17 25 q7 4 14 0" fill="none" stroke="#4e8f3a" stroke-width="2" stroke-linecap="round"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

function countryFlagDataUri(code) {
  const svg = countryFlagSvg(code);
  return svg ? `data:image/svg+xml,${encodeURIComponent(svg)}` : null;
}

function countryFlagHTML(country) {
  const label = String(country || "Unknown").trim() || "Unknown";
  const code = COUNTRY_CODE_BY_NAME[countryKey(label)];
  const labelHTML = `<span class="country-flag-label">${escapeHtml(label)}</span>`;
  const flagSrc = code ? countryFlagDataUri(code) : null;
  if (!flagSrc) {
    return `<span class="country-flag-wrap"><span class="country-flag country-flag-fallback" aria-hidden="true"></span>${labelHTML}</span>`;
  }
  return `<span class="country-flag-wrap"><img class="country-flag" src="${escapeHtmlAttr(flagSrc)}" alt="" loading="lazy" decoding="async">${labelHTML}</span>`;
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

  el.addEventListener("mouseenter", (e) => showCardTooltip(getCard(), el, e));
  el.addEventListener("mousemove", (e) => positionCardTooltip(e, el));
  el.addEventListener("mouseleave", hideCardTooltip);
}

function showCardTooltip(card, anchorElement, e) {
  if (!canUseHoverTooltips()) return;
  populateCardTooltip(card);
  positionCardTooltip(e, anchorElement);
}

function populateCardTooltip(card) {
  const t = $("cardTooltip");
  const rarity = card.rarity || "common";
  const rarityName = RARITY_LABEL[rarity] || "Common";
  const typeLabel = card.type === "minion" ? "Minion" : "Spell";
  const artClasses = ["minion-card", "card-tooltip-art", rarityClass(card)];
  if (card.type === "spell") artClasses.push("spell");
  const miniKeywords = activeKeywords(card);
  const miniKeywordsHTML = miniKeywords.length
    ? `<div class="tooltip-keywords zoom-keywords">${miniKeywords
        .map((k) => `<span class="tooltip-kw kw-${k}">${keywordIconHTML(k)} ${KEYWORD_FULL_LABEL[k] || k}</span>`)
        .join("")}</div>`
    : "";
  const miniStatuses = activeStatuses(card);
  const miniStatusesHTML = miniStatuses.length
    ? `<div class="tooltip-keywords tooltip-statuses zoom-keywords">${miniStatuses
        .map((status) => `<span class="tooltip-kw status-${status.type}">${escapeHtml(statusDescription(status))}</span>`)
        .join("")}</div>`
    : "";

  t.className = `card-tooltip hidden ${rarityClass(card)}`;
  t.innerHTML = `
    <div class="card-tooltip-content">
      <div class="${artClasses.join(" ")}">
        ${cardArtHTML(card)}
        ${cardCostHTML(card)}
        ${specialAbilityBadgeHTML(card)}
        <div class="card-badges">${keywordBadgesHTML(card)}</div>
        <div class="card-status-badges">${statusBadgesHTML(card)}</div>
        <div class="card-footer">
          ${
            card.type === "minion"
              ? `<span class="card-stat atk">${card.attack}</span><span class="card-name">${escapeHtml(card.name)}</span><span class="card-stat hp">${card.health}</span>`
              : `<span class="card-name">${escapeHtml(card.name)}</span>${spellEffectValueHTML(card)}`
          }
        </div>
      </div>
      <div class="card-tooltip-details">
        <div class="tooltip-header">
          <span class="tooltip-name">${escapeHtml(card.name)}</span>
          <span class="tooltip-rarity ${rarityClass(card)}">${rarityName}</span>
        </div>
        <div class="tooltip-meta">
          <span>${typeLabel}</span>
          ${card.race ? `<span class="tooltip-race">${escapeHtml(card.race)}</span>` : ""}
          <span class="tooltip-country">${countryFlagHTML(card.country)}</span>
        </div>
        ${miniKeywordsHTML}
        ${miniStatusesHTML}
        ${card.lore ? `<div class="tooltip-lore">${escapeHtml(card.lore)}</div>` : ""}
      </div>
    </div>
  `;
  t.classList.remove("hidden");
}

function visualViewportBounds() {
  const viewport = window.visualViewport;
  if (!viewport) {
    return {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  return {
    left: viewport.offsetLeft,
    top: viewport.offsetTop,
    right: viewport.offsetLeft + viewport.width,
    bottom: viewport.offsetTop + viewport.height,
    width: viewport.width,
    height: viewport.height,
  };
}

function anchorRectFromEvent(e) {
  return {
    left: e.clientX - 1,
    right: e.clientX + 1,
    top: e.clientY - 1,
    bottom: e.clientY + 1,
    width: 2,
    height: 2,
  };
}

function chooseTooltipPosition(anchorRect, tooltipRect, viewport) {
  const edge = 10;
  const gap = 12;
  const maxX = viewport.right - tooltipRect.width - edge;
  const maxY = viewport.bottom - tooltipRect.height - edge;
  const clampX = (value) => Math.max(viewport.left + edge, Math.min(maxX, value));
  const clampY = (value) => Math.max(viewport.top + edge, Math.min(maxY, value));
  const spaces = [
    { side: "right", value: viewport.right - anchorRect.right - gap },
    { side: "left", value: anchorRect.left - viewport.left - gap },
    { side: "below", value: viewport.bottom - anchorRect.bottom - gap },
    { side: "above", value: anchorRect.top - viewport.top - gap },
  ];
  const preferred = spaces.find((space) => space.value >= (space.side === "left" || space.side === "right" ? tooltipRect.width : tooltipRect.height));
  const side = preferred?.side || spaces.sort((a, b) => b.value - a.value)[0].side;

  if (side === "right") {
    return {
      left: clampX(anchorRect.right + gap),
      top: clampY(anchorRect.top + (anchorRect.height - tooltipRect.height) / 2),
    };
  }
  if (side === "left") {
    return {
      left: clampX(anchorRect.left - tooltipRect.width - gap),
      top: clampY(anchorRect.top + (anchorRect.height - tooltipRect.height) / 2),
    };
  }
  if (side === "above") {
    return {
      left: clampX(anchorRect.left + (anchorRect.width - tooltipRect.width) / 2),
      top: clampY(anchorRect.top - tooltipRect.height - gap),
    };
  }
  return {
    left: clampX(anchorRect.left + (anchorRect.width - tooltipRect.width) / 2),
    top: clampY(anchorRect.bottom + gap),
  };
}

function positionCardTooltip(e, anchorElement = null) {
  if (!e) return;
  const t = $("cardTooltip");
  if (t.classList.contains("hidden")) return;
  const viewport = visualViewportBounds();
  t.style.maxHeight = `${Math.max(220, viewport.height - 20)}px`;
  const tooltipRect = t.getBoundingClientRect();
  const anchorRect = anchorElement?.getBoundingClientRect?.() || anchorRectFromEvent(e);
  const position = chooseTooltipPosition(anchorRect, tooltipRect, viewport);
  t.style.left = `${position.left}px`;
  t.style.top = `${position.top}px`;
}

function hideCardTooltip() {
  const tooltip = $("cardTooltip");
  if (!tooltip) return;
  tooltip.classList.add("hidden");
  tooltip.style.left = "";
  tooltip.style.top = "";
  tooltip.style.maxHeight = "";
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
  const viewport = visualViewportBounds();
  tooltip.style.maxHeight = `${Math.max(220, viewport.height - 20)}px`;
  const position = chooseTooltipPosition(element.getBoundingClientRect(), tooltip.getBoundingClientRect(), viewport);
  tooltip.style.left = `${position.left}px`;
  tooltip.style.top = `${position.top}px`;
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

// Touch devices have no real "mouseleave" - the only way a tooltip
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
    return; // no server reachable (e.g. offline vs-NPC file:// usage) - nothing to show
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
    void loadRankedIncoming();
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

function syncDiscordActivityDocumentState() {
  document.documentElement.dataset.discordActivity = isDiscordActivityEnvironment() ? "true" : "false";
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

function markActivityInviteSeen() {
  try {
    localStorage.setItem(ACTIVITY_INVITE_SEEN_STORAGE_KEY, "true");
  } catch (err) {
    // The badge remains visible if storage is unavailable.
  }
  syncActivityInviteBadge();
}

function syncActivityInviteBadge() {
  const badge = $("activityInviteGoldBadge");
  if (!badge) return;
  let seen = false;
  try {
    seen = localStorage.getItem(ACTIVITY_INVITE_SEEN_STORAGE_KEY) === "true";
  } catch (err) {
    // The badge remains visible if storage is unavailable.
  }
  badge.classList.toggle("hidden", seen);
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

function setAudioActivationVisible(visible) {
  $("btnEnableAudio")?.classList.toggle("hidden", !visible);
}

function inviteDiscordActivity() {
  const inviteUrl = accountState?.discordInviteUrl;
  if (!inviteUrl) {
    showToast("Discord activity invite is not configured yet.");
    return;
  }
  window.open(inviteUrl, "_blank", "noopener,noreferrer");
}

function setActivityInviteOpen(open) {
  const modal = $("activityInviteModal");
  if (!modal) return;
  modal.classList.toggle("hidden", !open);
  if (open) setMenuOptionsOpen(false);
}

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function getFullscreenTarget() {
  return document.documentElement;
}

function canUseFullscreen() {
  const target = getFullscreenTarget();
  return Boolean(target?.requestFullscreen || target?.webkitRequestFullscreen);
}

function syncFullscreenButton() {
  const button = $("btnFullscreen");
  if (!button) return;
  const supported = canUseFullscreen();
  const active = Boolean(getFullscreenElement());
  button.classList.toggle("hidden", !supported);
  button.classList.toggle("is-active", active);
  button.setAttribute("aria-pressed", active ? "true" : "false");
  button.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
  const label = button.querySelector("span");
  if (label) label.textContent = active ? "Exit full" : "Fullscreen";
}

async function toggleFullscreen() {
  try {
    if (getFullscreenElement()) {
      const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
      if (!exitFullscreen) throw new Error("Fullscreen exit is not supported here.");
      await exitFullscreen.call(document);
    } else {
      const target = getFullscreenTarget();
      const requestFullscreen = target.requestFullscreen || target.webkitRequestFullscreen;
      if (!requestFullscreen) throw new Error("Fullscreen is not supported here.");
      await requestFullscreen.call(target);
    }
  } catch (err) {
    showToast(err.message || "Fullscreen is not available here.");
  } finally {
    syncFullscreenButton();
  }
}

function openActivityInviteModal() {
  if (!accountState?.discordInviteUrl) {
    showToast("Discord activity invite is not configured yet.");
    return;
  }
  if (!accountState?.loggedIn || !accountState?.user) {
    showToast("Login with Discord to claim the invite reward.");
    return;
  }
  markActivityInviteSeen();
  setActivityInviteOpen(true);
}

async function confirmActivityInvite() {
  const button = $("btnConfirmActivityInvite");
  if (button) button.disabled = true;
  inviteDiscordActivity();
  try {
    const response = await apiFetch("/auth/discord/activity-invite-reward", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not claim the invite reward.");
    if (data.reward?.gold != null) updateAccountDisplay({ ...(accountState?.user || {}), gold: data.reward.gold });
    if (data.reward?.goldAwarded > 0) {
      showToast(`Discord Activity invite reward: +${data.reward.goldAwarded} gold.`);
    } else {
      showToast("Discord Activity invite reward was already claimed.");
    }
    setActivityInviteOpen(false);
  } catch (err) {
    showToast(err.message || "Could not claim the invite reward.");
  } finally {
    if (button) button.disabled = false;
  }
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

let rankedIncomingTimer = null;
async function loadRankedIncoming() {
  const notice = $("tournamentIncoming");
  if (!notice) return;
  try {
    const response = await apiFetch("/ranking/ranked");
    const data = await response.json();
    const window = data.window || {};
    const startsInMs = window.startsAt ? Date.parse(window.startsAt) - Date.now() : Infinity;
    const shouldShow = window.open || (startsInMs >= 0 && startsInMs <= 60 * 60 * 1000);
    notice.classList.toggle("hidden", !shouldShow);
    if (shouldShow) notice.lastChild.textContent = window.open ? "Ranked is open now (CET)" : "Ranked starts in less than 1 hour (CET)";
  } catch (err) {
    notice.classList.add("hidden");
  } finally {
    clearTimeout(rankedIncomingTimer);
    rankedIncomingTimer = setTimeout(loadRankedIncoming, 60 * 1000);
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
  const nextUser = user.ranked ? { ...user, ranked: normalizeRankedDisplay(user.ranked) } : user;
  if (accountState) accountState.user = { ...(accountState.user || {}), ...nextUser };
  if (accountState?.user?.ranked) accountState.user.ranked = normalizeRankedDisplay(accountState.user.ranked);
  const mergedUser = accountState?.user || nextUser;
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
  setModeGoldProgress("singleplayer", rewards.singleplayer, 80);
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

window.ArcaneClient = {
  getAccountState: () => accountState,
};

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

$("btnInviteDiscordActivity").addEventListener("click", openActivityInviteModal);
$("btnFullscreen").addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", syncFullscreenButton);
document.addEventListener("webkitfullscreenchange", syncFullscreenButton);

$("btnOpenAudioConfig").addEventListener("click", () => {
  setMenuOptionsOpen(false);
  setAudioConfigOpen(true);
});

$("btnOpenChangelog").addEventListener("click", () => setChangelogOpen(true));
syncDiscordActivityDocumentState();
syncChangelogNewBadge();
syncActivityInviteBadge();
syncFullscreenButton();
$("btnCloseChangelog").addEventListener("click", () => setChangelogOpen(false));
$("changelogModal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) setChangelogOpen(false);
});

$("btnCloseActivityInvite").addEventListener("click", () => setActivityInviteOpen(false));
$("btnCancelActivityInvite").addEventListener("click", () => setActivityInviteOpen(false));
$("btnConfirmActivityInvite").addEventListener("click", confirmActivityInvite);
$("activityInviteModal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) setActivityInviteOpen(false);
});

$("btnOpenHowToPlay").addEventListener("click", () => setHowToPlayOpen(true));
$("btnCloseHowToPlay").addEventListener("click", () => setHowToPlayOpen(false));
$("howToPlayModal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) setHowToPlayOpen(false);
});

$("btnCloseAudioConfig").addEventListener("click", () => setAudioConfigOpen(false));
$("musicVolumeInput").addEventListener("input", (event) => updateVolumeFromInput("music", event.target.value));
$("sfxVolumeInput").addEventListener("input", (event) => updateVolumeFromInput("sfx", event.target.value));
$("btnEnableAudio").addEventListener("click", () => {
  void window.ArcaneAudio?.unlock();
});
window.addEventListener("arcaneAudioState", (event) => {
  setAudioActivationVisible(event.detail?.state === "blocked");
});

document.addEventListener("click", (event) => {
  if (!closestElement(event.target, ".menu-options")) setMenuOptionsOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setQuickplayRankingModalOpen(false);
    setRankedRewardsModalOpen(false);
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

function cardFreeTiltShell(card) {
  return card?.closest?.(".card-tilt-shell, .card-opening-slot") || null;
}

const CARD_PARALLAX_STICKY_MARGIN = 18;
let activeParallaxCard = null;

function cardCanUseParallax(card) {
  if (!card) return false;
  if (card.classList.contains("mulligan-card")) return false;
  if (card.classList.contains("dying") || card.classList.contains("inventory-card-locked") || card.dataset.dragArmed) return false;
  if (card.closest(".card-opening-slot.is-face-down")) return false;
  return true;
}

function cardParallaxHitRect(card) {
  const shell = cardFreeTiltShell(card);
  return (shell || card).getBoundingClientRect();
}

function pointInsideExpandedRect(rect, x, y, margin = 0) {
  return x >= rect.left - margin &&
    x <= rect.right + margin &&
    y >= rect.top - margin &&
    y <= rect.bottom + margin;
}

function pointerInsideParallaxCard(card, event, margin = CARD_PARALLAX_STICKY_MARGIN) {
  if (!card || !document.body.contains(card)) return false;
  return pointInsideExpandedRect(cardParallaxHitRect(card), event.clientX, event.clientY, margin);
}

function setActiveParallaxCard(card) {
  if (activeParallaxCard && activeParallaxCard !== card) resetCardParallax(activeParallaxCard);
  activeParallaxCard = card;
}

function getEventParallaxCard(event) {
  const directCard = closestElement(event.target, ".minion-card, .hand-card");
  if (directCard && cardCanUseParallax(directCard)) return directCard;
  if (activeParallaxCard && cardCanUseParallax(activeParallaxCard) && pointerInsideParallaxCard(activeParallaxCard, event)) {
    return activeParallaxCard;
  }
  return null;
}

function resetCardParallax(card) {
  if (!card || card.dataset.dragArmed) return;
  if (activeParallaxCard === card) activeParallaxCard = null;
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

function cardParallaxProfile(card) {
  const freeShell = cardFreeTiltShell(card);
  const inOpening = Boolean(card.closest(".card-opening-slot"));
  const inHand = card.classList.contains("hand-card");
  return {
    freeShell,
    maxRotate: inOpening ? 25 : freeShell ? 21 : 16,
    zRotate: freeShell ? 2.4 : 0,
    lift: inOpening ? "-8px" : freeShell ? "-6px" : "-5px",
    zIndex: inHand ? "40" : freeShell ? "30" : "10",
  };
}

// Track mouse entry to animate the initial tilt smoothly instead of snapping
document.addEventListener("mouseenter", (e) => {
  if (!canUseHoverTooltips()) return;
  const card = closestElement(e.target, ".minion-card, .hand-card");
  if (!card) return;

  if (!cardCanUseParallax(card)) return;

  setActiveParallaxCard(card);
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
  const card = getEventParallaxCard(e);
  if (!card) {
    if (activeParallaxCard) resetCardParallax(activeParallaxCard);
    return;
  }

  if (!cardCanUseParallax(card)) return;
  setActiveParallaxCard(card);

  const rect = cardParallaxHitRect(card);
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const profile = cardParallaxProfile(card);
  const maxRotate = profile.maxRotate;
  
  // Consistent tilt: card face tilts TOWARDS the cursor
  const rotateX = ((y - centerY) / centerY) * maxRotate;
  const rotateY = ((centerX - x) / centerX) * maxRotate;
  const rotateZ = ((x - centerX) / centerX) * profile.zRotate;

  // If we just entered, keep the smooth transition. Otherwise, update fast for real-time tracking
  if (card.dataset.entering !== "true") {
    card.style.transition = "transform 0.08s ease-out, box-shadow 0.15s ease";
  }
  
  // Hand card vs Board/inspection card adjustments (keep selected state translate offset)
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
      baseTranslateY = profile.lift;
    }
    card.style.transform = `translateY(${baseTranslateY}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
  }
  card.style.zIndex = profile.zIndex;

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

  // Update holographic foil for premium card finishes.
  const isHolo = card.classList.contains("rarity-legendary") || card.classList.contains("rarity-mythic") || card.classList.contains("rarity-souvenir");
  if (isHolo) {
    // Angle is derived from the cursor position across the card diagonally
    const foilAngle = 90 + ((x / rect.width) - 0.5) * 80 + ((y / rect.height) - 0.5) * 40;
    card.style.setProperty("--foil-angle", `${foilAngle}deg`);
    card.style.setProperty("--foil-opacity", card.classList.contains("rarity-souvenir") ? "0.95" : "0.8");
  }
});

document.addEventListener("mouseout", (e) => {
  if (!canUseHoverTooltips()) return;
  const card = closestElement(e.target, ".minion-card, .hand-card");
  if (!card) return;

  // If moving out of the card (not to a child node)
  const shell = cardFreeTiltShell(card);
  if (!e.relatedTarget || (!card.contains(e.relatedTarget) && !shell?.contains(e.relatedTarget))) {
    resetCardParallax(card);
  }
});
