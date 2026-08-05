const assert = require("assert");
const fs = require("fs");

const html = fs.readFileSync("public/index.html", "utf8");
const css = fs.readFileSync("public/css/base.css", "utf8");
const client = fs.readFileSync("public/client.js", "utf8");

assert(html.includes('id="globalMatchSearchStatus"'), "A global match search status button should exist outside lobby screens.");
assert(html.includes("Buscando"), "The global search status should show the requested Buscando label.");
assert(css.includes(".global-match-search-status"), "The global search status should have shared fixed-position styling.");
assert(client.includes('addEventListener("click", cancelActiveMatchSearch)'), "The global search button should cancel the active queue.");
assert(client.includes('if (quickplaySearching || rankedSearching) window.ArcaneAudio?.playSfx("matchFound")'), "Ranked and Quickplay should share the match-found sound.");

const backHandler = client.match(/\$\("btnBackToMenu"\)\.addEventListener\("click", \(\) => \{([\s\S]*?)\n\}\);/);
assert(backHandler, "Back to menu handler should be present.");
assert(!backHandler[1].includes("cancelQuickplay"), "Leaving the multiplayer screen must not cancel Quickplay search.");
assert(!backHandler[1].includes("cancelRanked"), "Leaving the multiplayer screen must not cancel Ranked search.");

console.log("--- GLOBAL MATCH SEARCH TEST OK ---");
