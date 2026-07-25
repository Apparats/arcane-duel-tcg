const assert = require("assert");
const fs = require("fs");

const serverSource = fs.readFileSync("server/index.js", "utf8");
const configSource = fs.readFileSync("public/audioConfig.js", "utf8");
const managerSource = fs.readFileSync("public/audioManager.js", "utf8");

assert(serverSource.includes("max-age=31536000, immutable"), "Audio assets need persistent browser caching.");
assert(serverSource.includes("assets\\/audio"), "The server must target audio files specifically.");
assert(configSource.includes("assetVersion"), "Audio URLs need a version for safe cache invalidation.");
assert(managerSource.includes("config.assetVersion"), "Audio manager must append the audio asset version.");
assert(fs.existsSync("public/assets/audio/music/Board3.ogg"), "The new board music asset should exist.");
assert(configSource.includes("music/Board3.ogg"), "Audio config should include the new board music track.");

console.log("--- AUDIO DELIVERY TEST OK ---");
