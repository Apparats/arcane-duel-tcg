const assert = require("assert");
const { isTrustedWebSocketOrigin } = require("../server/security");

function request(origin, host = "tcg.warera.wiki") {
  return { headers: { origin, host } };
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

process.env.PUBLIC_APP_ORIGIN = "https://tcg.warera.wiki";
assert.strictEqual(isTrustedWebSocketOrigin(request("https://tcg.warera.wiki", "localhost:8443")), true);
assert.strictEqual(isTrustedWebSocketOrigin(request("http://localhost:8443", "localhost:8443")), false);

if (previousPublicOrigin === undefined) delete process.env.PUBLIC_APP_ORIGIN;
else process.env.PUBLIC_APP_ORIGIN = previousPublicOrigin;
if (previousAllowedOrigins === undefined) delete process.env.WS_ALLOWED_ORIGINS;
else process.env.WS_ALLOWED_ORIGINS = previousAllowedOrigins;
if (previousClientId === undefined) delete process.env.DISCORD_CLIENT_ID;
else process.env.DISCORD_CLIENT_ID = previousClientId;

console.log("--- SOCKET SECURITY TEST OK ---");
