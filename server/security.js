const WINDOW_MS = 60 * 1000;

function normalizeOrigin(value) {
  if (!value) return null;

  try {
    return new URL(String(value)).origin;
  } catch {
    return null;
  }
}

function requestOrigin(req) {
  const origin = typeof req.get === "function" ? req.get("origin") : req.headers?.origin;
  return normalizeOrigin(origin);
}

function configuredOrigins(...values) {
  return values
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .map(normalizeOrigin)
    .filter(Boolean);
}

function hasConfiguredOrigin(...values) {
  return values.some((value) => String(value || "").trim().length > 0);
}

function discordActivityOrigin() {
  const clientId = String(process.env.DISCORD_CLIENT_ID || "");
  return /^\d{5,32}$/.test(clientId) ? `https://${clientId}.discordsays.com` : null;
}

function isDiscordActivityOrigin(origin) {
  const expectedOrigin = discordActivityOrigin();
  return Boolean(expectedOrigin && origin === expectedOrigin);
}

function isDiscordActivityRequest(req) {
  return isDiscordActivityOrigin(requestOrigin(req));
}

function requestMatchesHost(origin, req) {
  const host = String(req.headers?.host || (typeof req.get === "function" ? req.get("host") : "")).toLowerCase();
  return Boolean(host && new URL(origin).host.toLowerCase() === host);
}

// Discord Activities are served through a per-application proxy origin. Allow
// only that exact origin, never discord.com or a wildcard subdomain.
function isTrustedHttpOrigin(req) {
  const origin = requestOrigin(req);
  if (!origin) return true;
  if (isDiscordActivityOrigin(origin)) return true;

  const publicOrigins = new Set(configuredOrigins(process.env.PUBLIC_APP_ORIGIN));
  if (hasConfiguredOrigin(process.env.PUBLIC_APP_ORIGIN)) return publicOrigins.has(origin);
  return requestMatchesHost(origin, req);
}

function isTrustedWebSocketOrigin(req) {
  const origin = requestOrigin(req);
  if (!origin) return false;
  if (isDiscordActivityOrigin(origin)) return true;

  const configured = new Set(configuredOrigins(process.env.PUBLIC_APP_ORIGIN, process.env.WS_ALLOWED_ORIGINS));
  if (hasConfiguredOrigin(process.env.PUBLIC_APP_ORIGIN, process.env.WS_ALLOWED_ORIGINS)) {
    return configured.has(origin);
  }
  return requestMatchesHost(origin, req);
}

function setSecurityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "script-src 'self' https://static.cloudflareinsights.com",
      "worker-src 'self'",
      "style-src 'self' https://fonts.googleapis.com",
      "style-src-attr 'unsafe-inline'",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://cdn.discordapp.com",
      "media-src 'self'",
      "connect-src 'self' wss: https://cloudflareinsights.com",
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
  if (isTrustedHttpOrigin(req)) return next();
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
  isDiscordActivityRequest,
  isTrustedHttpOrigin,
  isTrustedWebSocketOrigin,
  requireSameOrigin,
  setSecurityHeaders,
};

