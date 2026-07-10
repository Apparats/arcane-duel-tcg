const WINDOW_MS = 60 * 1000;

function sameOrigin(req) {
  const origin = req.get("origin");
  if (!origin) return true;

  try {
    const parsed = new URL(origin);
    return parsed.host === req.get("host");
  } catch {
    return false;
  }
}

function configuredOrigins() {
  return [process.env.PUBLIC_APP_ORIGIN, process.env.WS_ALLOWED_ORIGINS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .flatMap((value) => {
      try {
        return [new URL(value).origin];
      } catch {
        return [];
      }
    });
}

function discordActivityOrigin() {
  const clientId = String(process.env.DISCORD_CLIENT_ID || "");
  return /^\d{5,32}$/.test(clientId) ? `https://${clientId}.discordsays.com` : null;
}

// A Discord Activity runs in an iframe, but its document origin remains this
// game's public URL. discord.com itself must not be allowed here.
function isTrustedWebSocketOrigin(req) {
  const origin = String(req.headers?.origin || "");
  if (!origin) return false;

  let normalizedOrigin;
  try {
    normalizedOrigin = new URL(origin).origin;
  } catch {
    return false;
  }

  const configured = new Set(configuredOrigins());
  const hasConfiguredAppOrigins = configured.size > 0;
  const discordOrigin = discordActivityOrigin();
  if (discordOrigin) configured.add(discordOrigin);
  if (hasConfiguredAppOrigins) return configured.has(normalizedOrigin);
  if (discordOrigin && normalizedOrigin === discordOrigin) return true;

  const host = String(req.headers?.host || "").toLowerCase();
  return new URL(normalizedOrigin).host.toLowerCase() === host;
}

function setSecurityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "script-src 'self'",
      "style-src 'self' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://cdn.discordapp.com",
      "media-src 'self'",
      "connect-src 'self' wss:",
      "form-action 'self'",
      "frame-ancestors 'self' https://discord.com https://*.discord.com",
    ].join("; ")
  );
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

function requireSameOrigin(req, res, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  if (req.path === "/auth/discord/activity" || req.path === "/discord/activity") return next();
  if (req.path === "/client-log") return next();
  if (sameOrigin(req)) return next();
  return res.status(403).json({ error: "Cross-origin requests are not allowed." });
}

function createRateLimiter({ windowMs = WINDOW_MS, max = 60, keyPrefix = "global" } = {}) {
  const buckets = new Map();
  let nextCleanupAt = Date.now() + Math.min(windowMs, WINDOW_MS);

  return function rateLimit(req, res, next) {
    const now = Date.now();
    if (now >= nextCleanupAt) {
      buckets.forEach((bucket, key) => {
        if (now > bucket.resetAt) buckets.delete(key);
      });
      nextCleanupAt = now + Math.min(windowMs, WINDOW_MS);
    }
    const key = `${keyPrefix}:${req.ip || req.socket.remoteAddress || "unknown"}`;
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({ error: "Too many requests. Please slow down." });
    }

    return next();
  };
}

module.exports = {
  createRateLimiter,
  isTrustedWebSocketOrigin,
  requireSameOrigin,
  setSecurityHeaders,
};
