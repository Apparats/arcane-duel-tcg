const assert = require("assert");
const fs = require("fs");

const source = fs.readFileSync("public/service-worker.js", "utf8");
const registrationSource = fs.readFileSync("public/pwa.js", "utf8");

assert(!/\|ogg\||\|wav\|/.test(source), "Audio files must never be cached by the service worker.");
assert(source.includes('arcana-tcg-shell-v1.5.4-media-direct-v2'), "The media-safe cache version must replace old cached responses.");
assert(source.includes('request.method !== "GET"'), "Non-GET requests must remain outside the service worker cache.");
assert(source.includes("self.skipWaiting()"), "The media fix must replace old workers without waiting for stale audio caches.");
assert(!registrationSource.includes('window.top !== window || isInstalled()) return'), "Installed PWAs must continue registering service worker updates.");
assert(registrationSource.includes("registration.update()"), "PWA startup must request the newest worker.");

console.log("--- SERVICE WORKER MEDIA CACHE TEST OK ---");
