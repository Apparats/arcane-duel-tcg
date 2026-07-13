const assert = require("assert");
const { isTrustedHttpOrigin, isTrustedWebSocketOrigin, requireSameOrigin } = require("../server/security");

function request(origin, host = "tcg.warera.wiki", { method = "POST", path = "/auth/ws-ticket" } = {}) {
  const headers = { origin, host };
  return {
    headers,
    method,
    path,
    get(name) {
      return headers[String(name).toLowerCase()];
    },
  };
}

function evaluateStateChange(req) {
  let allowed = false;
  let status = null;
  let body = null;
  const response = {
    status(code) {
      status = code;
      return this;
    },
    json(value) {
      body = value;
    },
  };
  requireSameOrigin(req, response, () => {
    allowed = true;
  });
  return { allowed, status, body };
}

const previousPublicOrigin = process.env.PUBLIC_APP_ORIGIN;
const previousAllowedOrigins = process.env.WS_ALLOWED_ORIGINS;
const previousClientId = process.env.DISCORD_CLIENT_ID;
delete process.env.PUBLIC_APP_ORIGIN;
delete process.env.WS_ALLOWED_ORIGINS;
process.env.DISCORD_CLIENT_ID = "1523179359106502716";

assert.strictEqual(isTrustedWebSocketOrigin(request("https://tcg.warera.wiki")), true);
assert.strictEqual(isTrustedWebSocketOrigin(request("https://evil.example")), false);
assert.strictEqual(isTrustedWebSocketOrigin(request("")), false);
assert.strictEqual(isTrustedWebSocketOrigin(request("https://1523179359106502716.discordsays.com", "localhost:8443")), true);
assert.strictEqual(isTrustedHttpOrigin(request("https://1523179359106502716.discordsays.com", "localhost:8443")), true);
assert.strictEqual(isTrustedHttpOrigin(request("https://other.discordsays.com", "localhost:8443")), false);
assert.strictEqual(evaluateStateChange(request("https://1523179359106502716.discordsays.com", "localhost:8443")).allowed, true);
assert.deepStrictEqual(evaluateStateChange(request("https://evil.example", "localhost:8443")), {
  allowed: false,
  status: 403,
  body: { error: "Cross-origin requests are not allowed." },
});

process.env.PUBLIC_APP_ORIGIN = "https://tcg.warera.wiki";
assert.strictEqual(isTrustedWebSocketOrigin(request("https://tcg.warera.wiki", "localhost:8443")), true);
assert.strictEqual(isTrustedWebSocketOrigin(request("http://localhost:8443", "localhost:8443")), false);
assert.strictEqual(isTrustedHttpOrigin(request("https://tcg.warera.wiki", "localhost:8443")), true);
assert.strictEqual(isTrustedHttpOrigin(request("http://localhost:8443", "localhost:8443")), false);
assert.strictEqual(isTrustedHttpOrigin(request("https://1523179359106502716.discordsays.com", "localhost:8443")), true);

if (previousPublicOrigin === undefined) delete process.env.PUBLIC_APP_ORIGIN;
else process.env.PUBLIC_APP_ORIGIN = previousPublicOrigin;
if (previousAllowedOrigins === undefined) delete process.env.WS_ALLOWED_ORIGINS;
else process.env.WS_ALLOWED_ORIGINS = previousAllowedOrigins;
if (previousClientId === undefined) delete process.env.DISCORD_CLIENT_ID;
else process.env.DISCORD_CLIENT_ID = previousClientId;

console.log("--- SOCKET SECURITY TEST OK ---");

