const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

async function main() {
  const listeners = new Map();
  let playCalls = 0;
  let now = 0;

  class FakeAudio {
    constructor() {
      this.paused = true;
      this.ended = false;
      this.currentTime = 0;
      this.volume = 1;
      this.listeners = new Map();
    }

    addEventListener(type, callback) {
      this.listeners.set(type, callback);
    }

    load() {}
    pause() { this.paused = true; }
    cloneNode() { return new FakeAudio(); }

    play() {
      playCalls += 1;
      if (playCalls === 1) return Promise.reject(new Error("Autoplay blocked."));
      this.paused = false;
      return Promise.resolve();
    }
  }

  const context = {
    window: {
      ArcaneAudioConfig: {
        music: { mainMenu: { src: "music/menu.ogg", loop: true, volume: 1 } },
        sfx: {},
        musicByScreen: { menu: "mainMenu" },
      },
    },
    Audio: FakeAudio,
    Node: { ELEMENT_NODE: 1 },
    document: {
      addEventListener(type, callback) { listeners.set(type, callback); },
    },
    localStorage: { getItem() { return null; }, setItem() {} },
    performance: { now: () => (now += 100) },
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
    console: { warn() {} },
  };
  vm.runInNewContext(fs.readFileSync("public/audioManager.js", "utf8"), context);

  const audio = context.window.ArcaneAudio;
  await audio.playMusic("mainMenu");
  await audio.unlock();
  assert.strictEqual(playCalls, 1, "The first automatic attempt should be made once.");

  const inertTarget = { nodeType: 1, closest: () => null };
  listeners.get("click")({ target: inertTarget });
  await new Promise((resolve) => setImmediate(resolve));
  assert.strictEqual(playCalls, 2, "A later user click must retry music after autoplay blocks the first attempt.");
  console.log("--- AUDIO UNLOCK TEST OK ---");
}

main().catch((err) => {
  console.error("AUDIO UNLOCK TEST FAILED:", err);
  process.exit(1);
});
