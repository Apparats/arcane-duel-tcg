const assert = require("assert");
const fs = require("fs");

const source = fs.readFileSync("public/service-worker.js", "utf8");

assert(!/\|ogg\||\|wav\|/.test(source), "Audio files must never be cached by the service worker.");
assert(source.includes('arcana-tcg-shell-v1.5.4-media-network'), "The media-safe cache version must replace old cached responses.");
assert(source.includes('request.method !== "GET"'), "Non-GET requests must remain outside the service worker cache.");

console.log("--- SERVICE WORKER MEDIA CACHE TEST OK ---");
