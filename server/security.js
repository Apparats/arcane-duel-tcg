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

function setSecurityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://discord.com https://*.discord.com"
  );
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

function requireSameOrigin(req, res, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  if (req.path === "/auth/discord/activity") return next();
  if (sameOrigin(req)) return next();
  return res.status(403).json({ error: "Cross-origin requests are not allowed." });
}

function createRateLimiter({ windowMs = WINDOW_MS, max = 60, keyPrefix = "global" } = {}) {
  const buckets = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();
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
  requireSameOrigin,
  setSecurityHeaders,
};
