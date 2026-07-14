// ============================================================
// AUTH — Discord OAuth2 login + JWT session cookie.
// ------------------------------------------------------------
// Stateless sessions: no server-side session store. On successful
// login we sign a small JWT (just the Mongo user id) and set it as an
// httpOnly cookie. Every request that needs "who's logged in" verifies
// that cookie and looks the user up in MongoDB — no separate sessions
// collection to keep in sync or expire.
//
// Gracefully disabled if the required env vars aren't set (see
// isAuthEnabled()) — the rest of the game (online/local play) doesn't
// depend on this at all.
// ============================================================

const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { buildStarterOpening } = require("./cardRewards");
const {
  consumePendingRewards,
  findOrCreateUserFromDiscord,
  findUserById,
  getDailyRewardProgress,
  grantDailyLoginReward,
  isDbEnabled,
} = require("./db");
const { getStarterCardPool } = require("./shopCatalog");
const { isDiscordActivityRequest } = require("./security");
const { issueWsTicket } = require("./wsTicketService");

const DISCORD_API = "https://discord.com/api/v10";
const COOKIE_NAME = "arcane_session";
const OAUTH_STATE_COOKIE_NAME = "arcane_oauth_state";
const SESSION_DURATION = "30d";
const OAUTH_STATE_DURATION_MS = 10 * 60 * 1000;

function isAuthEnabled() {
  return Boolean(
    process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET && process.env.DISCORD_REDIRECT_URI && process.env.JWT_SECRET
  );
}

function getDiscordInviteUrl() {
  if (process.env.DISCORD_ACTIVITY_INVITE_URL) return process.env.DISCORD_ACTIVITY_INVITE_URL;
  if (!process.env.DISCORD_CLIENT_ID) return null;
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    scope: "applications.commands",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

function getDiscordOAuthScope() {
  const configuredScopes = String(process.env.DISCORD_OAUTH_SCOPES || "identify")
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
  const scopes = configuredScopes.includes("identify") ? configuredScopes : ["identify", ...configuredScopes];
  return [...new Set(scopes)].join(" ");
}

function signSession(userId) {
  return jwt.sign({ userId: String(userId) }, process.env.JWT_SECRET, { expiresIn: SESSION_DURATION });
}

function cookieSecure() {
  return process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
}

function setSessionCookie(res, token, { embedded = false } = {}) {
  const secure = cookieSecure();
  const partitioned = embedded && secure;
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    // Discord Activities run in a cross-site iframe. Lax cookies are not
    // reliably returned for later API calls from that context.
    sameSite: partitioned ? "none" : "lax",
    partitioned,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days, mirrors SESSION_DURATION
  });
}

function setOAuthStateCookie(res, state) {
  res.cookie(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    maxAge: OAUTH_STATE_DURATION_MS,
  });
}

function clearOAuthStateCookie(res) {
  res.clearCookie(OAUTH_STATE_COOKIE_NAME, {
    secure: cookieSecure(),
    sameSite: "lax",
  });
}

function timingSafeEqualString(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isValidDiscordTokenResponse(tokenData) {
  return Boolean(
    tokenData &&
      typeof tokenData === "object" &&
      typeof tokenData.access_token === "string" &&
      tokenData.access_token.length > 0 &&
      String(tokenData.token_type || "").toLowerCase() === "bearer"
  );
}

async function exchangeDiscordCode(code, { redirectUri = null } = {}) {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
  });
  if (redirectUri) body.set("redirect_uri", redirectUri);

  const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    const err = new Error("Discord token exchange failed.");
    err.detail = detail;
    throw err;
  }

  const tokenData = await tokenRes.json();
  if (!isValidDiscordTokenResponse(tokenData)) {
    throw new Error("Discord token exchange returned an invalid token payload.");
  }
  return tokenData;
}

async function fetchDiscordProfile(accessToken) {
  const profileRes = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) {
    const detail = await profileRes.text();
    const err = new Error("Discord profile fetch failed.");
    err.detail = detail;
    throw err;
  }
  return profileRes.json();
}

async function findOrCreateSessionUser(profile) {
  const starterPool = getStarterCardPool();
  const starterCards = starterPool.length > 0 ? buildStarterOpening(starterPool) : [];
  return findOrCreateUserFromDiscord(profile, starterCards);
}

// Reads the session cookie (if any) and resolves it to a public-safe
// user object, or null if there's no valid session. Never throws.
function readBearerToken(req) {
  const value = String(req.get("authorization") || "");
  const match = /^Bearer\s+([^\s]{1,4096})$/i.exec(value);
  return match ? match[1] : null;
}

async function getSessionUserByToken(token) {
  if (!isAuthEnabled() || !isDbEnabled()) return null;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findUserById(payload.userId);
    if (!user) return null;
    return toPublicUser(user);
  } catch (err) {
    return null; // expired/invalid token — treat as logged out, don't crash the request
  }
}

// Prefer the Activity bearer session when present. Browser login continues to
// use the httpOnly cookie, so normal OAuth navigation does not expose a JWT.
async function getSessionUser(req) {
  return getSessionUserByToken(readBearerToken(req) || req.cookies?.[COOKIE_NAME]);
}

// Never send the full Mongo document to the client — trim it to what
// the UI actually needs.
function toPublicUser(user) {
  return {
    id: String(user._id),
    username: user.username,
    avatarUrl: user.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : null,
    stats: user.stats || { wins: 0, losses: 0, surrenders: 0, quickplayWins: 0 },
    modeStats: user.modeStats || {},
    gold: user.gold || 0,
    economy: {
      dailyRewards: getDailyRewardProgress(user),
    },
    warnings: user.warnings || [],
    unlockedCards: user.unlockedCards || [],
    cardCollection: user.cardCollection || {},
    selectedTitle: user.selectedTitle || "initiate",
    equippedBadgeIds: user.equippedBadgeIds || [],
    supporter: user.supporter === true,
  };
}

const router = express.Router();

router.get("/discord", (req, res) => {
  if (!isAuthEnabled()) {
    return res.status(503).send("Discord login isn't configured on this server yet.");
  }
  const state = crypto.randomBytes(24).toString("base64url");
  setOAuthStateCookie(res, state);
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: getDiscordOAuthScope(),
    state,
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

router.get("/discord/callback", async (req, res) => {
  if (!isAuthEnabled() || !isDbEnabled()) {
    return res.status(503).send("Discord login isn't configured on this server yet.");
  }

  const { code, error, state } = req.query;
  if (error) return res.redirect("/?authError=" + encodeURIComponent(error));
  if (!code) return res.redirect("/?authError=missing_code");
  if (!timingSafeEqualString(state, req.cookies?.[OAUTH_STATE_COOKIE_NAME])) {
    clearOAuthStateCookie(res);
    return res.redirect("/?authError=invalid_state");
  }
  clearOAuthStateCookie(res);

  try {
    const tokenData = await exchangeDiscordCode(code, { redirectUri: process.env.DISCORD_REDIRECT_URI });
    const profile = await fetchDiscordProfile(tokenData.access_token);
    const user = await findOrCreateSessionUser(profile);
    const session = signSession(user._id);
    setSessionCookie(res, session);
    res.redirect("/");
  } catch (err) {
    console.error("Discord OAuth callback error:", err.detail || err.message || err);
    res.redirect("/?authError=unexpected_error");
  }
});

router.post("/discord/activity", async (req, res) => {
  if (!isAuthEnabled() || !isDbEnabled()) {
    return res.status(503).json({ error: "Discord login isn't configured on this server yet." });
  }

  const code = req.body?.code;
  const accessToken = req.body?.accessToken;
  if (
    (typeof code !== "string" || code.length < 8 || code.length > 512) &&
    (typeof accessToken !== "string" || accessToken.length < 8 || accessToken.length > 2048)
  ) {
    return res.status(400).json({ error: "Missing Discord Activity authorization." });
  }

  try {
    const tokenData = accessToken ? { access_token: accessToken } : await exchangeDiscordCode(code);
    const profile = await fetchDiscordProfile(tokenData.access_token);
    const user = await findOrCreateSessionUser(profile);
    const session = signSession(user._id);
    setSessionCookie(res, session, { embedded: true });
    res.json({
      ok: true,
      access_token: tokenData.access_token,
      session_token: session,
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error("Discord Activity auth error:", err.detail || err.message || err);
    res.status(401).json({ error: "Discord Activity authentication failed." });
  }
});

router.get("/me", async (req, res) => {
  const user = await getSessionUser(req);
  const dailyLoginReward = user ? await grantDailyLoginReward(user.id) : null;
  if (dailyLoginReward?.claimed) user.gold = dailyLoginReward.gold;
  const rewards = user ? await consumePendingRewards(user.id) : [];
  res.json({
    loggedIn: Boolean(user),
    user,
    rewards,
    dailyLoginReward,
    authEnabled: isAuthEnabled(),
    discordClientId: process.env.DISCORD_CLIENT_ID || null,
    discordInviteUrl: getDiscordInviteUrl(),
  });
});

router.post("/ws-ticket", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Login with Discord is required." });
  res.setHeader("Cache-Control", "no-store");
  res.json({ ticket: issueWsTicket(user) });
});

router.post("/logout", (req, res) => {
  const secure = cookieSecure();
  const partitioned = secure && isDiscordActivityRequest(req);
  res.clearCookie(COOKIE_NAME, {
    secure,
    sameSite: partitioned ? "none" : "lax",
    partitioned,
  });
  res.json({ ok: true });
});

module.exports = { router, getSessionUser, isAuthEnabled };
