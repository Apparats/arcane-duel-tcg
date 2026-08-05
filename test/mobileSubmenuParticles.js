const assert = require("assert");
const fs = require("fs");

const indexSource = fs.readFileSync("public/index.html", "utf8");
const lobbyCss = fs.readFileSync("public/css/lobby.css", "utf8");

assert(
  indexSource.includes('css/lobby.css?v=1.7.1'),
  "Lobby CSS should be cache-busted after mobile submenu particle changes."
);

assert(
  /@media \(max-width: 760px\)[\s\S]*?#screen-lobby \.lobby-snow,[\s\S]*?#lobbyEmbers\s*\{[\s\S]*?display: none !important;/.test(lobbyCss),
  "Mobile submenu firefly containers should be hidden."
);

assert(
  /@media \(max-width: 760px\)[\s\S]*?#screen-lobby \.lobby-snow \.firefly,[\s\S]*?#lobbyEmbers \.firefly\s*\{[\s\S]*?animation: none !important;[\s\S]*?filter: none !important;[\s\S]*?opacity: 0 !important;/.test(lobbyCss),
  "Mobile submenu fireflies should not keep animation/filter work alive."
);

console.log("--- MOBILE SUBMENU PARTICLES TEST OK ---");
