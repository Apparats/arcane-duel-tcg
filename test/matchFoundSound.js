const assert = require("assert");
const fs = require("fs");

const configSource = fs.readFileSync("public/audioConfig.js", "utf8");
const clientSource = fs.readFileSync("public/client.js", "utf8");

assert(fs.existsSync("public/assets/audio/sfx/find.wav"), "Match-found sound asset should exist.");
assert(
  configSource.includes('matchFound: "sfx/find.wav"'),
  "Audio config should register find.wav as the matchFound sound effect."
);
assert(
  /case "matchStarted":[\s\S]*?quickplaySearching[\s\S]*?playSfx\("matchFound"\)/.test(clientSource),
  "Client should play matchFound when a quickplay search becomes a started match."
);

console.log("--- MATCH FOUND SOUND TEST OK ---");
