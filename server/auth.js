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
  connectDB,
  findOrCreateUserFromDiscord,
  findUserById,
  getDailyRewardProgress,
  grantDailyLoginReward,
  isDbEnabled,
} = require("./db");
const { getStarterCardPool } = require("./shopCatalog");

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

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
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

function readCookie(cookieHeader, name) {
  return String(cookieHeader || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

// Reads the session cookie (if any) and resolves it to a public-safe
// user object, or null if there's no valid session. Never throws.
async function getSessionUser(req) {
  if (!isAuthEnabled() || !isDbEnabled()) return null;
  const token = req.cookies && req.cookies[COOKIE_NAME];
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

async function getSessionUserFromCookieHeader(cookieHeader) {
  if (!isAuthEnabled() || !isDbEnabled()) return null;
  const token = readCookie(cookieHeader, COOKIE_NAME);
  if (!token) return null;

  try {
    await connectDB();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findUserById(payload.userId);
    if (!user) return null;
    return toPublicUser(user);
  } catch (err) {
    return null;
  }
}

// Never send the full Mongo document to the client — trim it to what
// the UI actually needs.
function toPublicUser(user) {
  return {
    id: String(user._id),
    username: user.username,
    avatarUrl: user.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : null,
    stats: user.stats || { wins: 0, losses: 0, surrenders: 0 },
    gold: user.gold || 0,
    economy: {
      dailyRewards: getDailyRewardProgress(user),
    },
    warnings: user.warnings || [],
    unlockedCards: user.unlockedCards || [],
    cardCollection: user.cardCollection || {},
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
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
    });
    if (!tokenRes.ok) {
      console.error("Discord token exchange failed:", await tokenRes.text());
      return res.redirect("/?authError=token_exchange_failed");
    }
    const tokenData = await tokenRes.json();
    if (!isValidDiscordTokenResponse(tokenData)) {
      console.error("Discord token exchange returned an invalid token payload.");
      return res.redirect("/?authError=invalid_token_payload");
    }

    const profileRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileRes.ok) {
      console.error("Discord profile fetch failed:", await profileRes.text());
      return res.redirect("/?authError=profile_fetch_failed");
    }
    const profile = await profileRes.json();

    const starterPool = getStarterCardPool();
    const starterCards = starterPool.length > 0 ? buildStarterOpening(starterPool) : [];
    const user = await findOrCreateUserFromDiscord(profile, starterCards);
    const session = signSession(user._id);
    setSessionCookie(res, session);
    res.redirect("/");
  } catch (err) {
    console.error("Discord OAuth callback error:", err);
    res.redirect("/?authError=unexpected_error");
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
    discordInviteUrl: getDiscordInviteUrl(),
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    secure: cookieSecure(),
    sameSite: "lax",
  });
  res.json({ ok: true });
});

module.exports = { router, getSessionUser, getSessionUserFromCookieHeader, isAuthEnabled };
