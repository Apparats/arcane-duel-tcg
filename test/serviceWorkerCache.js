const assert = require("assert");
const fs = require("fs");

const source = fs.readFileSync("public/service-worker.js", "utf8");
const registrationSource = fs.readFileSync("public/pwa.js", "utf8");

assert(!source.includes("audio"), "The service worker must not handle audio requests.");
assert(source.includes('arcana-tcg-shell-v1.6.6-v6'), "The minimal shell cache must replace older workers.");
assert(source.includes('request.method !== "GET"'), "Non-GET requests must remain outside the service worker cache.");
assert(source.includes('request.mode !== "navigate"'), "Only document navigations may be intercepted.");
assert(source.includes("self.skipWaiting()"), "The media fix must replace old workers without waiting for stale audio caches.");
assert(!registrationSource.includes('window.top !== window || isInstalled()) return'), "Installed PWAs must continue registering service worker updates.");
assert(registrationSource.includes("registration.update()"), "PWA startup must request the newest worker.");
assert(registrationSource.includes('updateViaCache: "none"'), "Service worker updates must bypass the browser HTTP cache.");

console.log("--- SERVICE WORKER MEDIA CACHE TEST OK ---");
