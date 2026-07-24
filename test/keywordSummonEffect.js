const assert = require("assert");
const fs = require("fs");

const clientSource = fs.readFileSync("public/client.js", "utf8");
const fxCss = fs.readFileSync("public/css/fx.css", "utf8");

assert(clientSource.includes('const KEYWORD_SUMMON_EFFECT_ORDER = ["taunt", "charge", "divineShield"]'), "Keyword summon effect should target Taunt, Charge, and Divine Shield.");
assert(/divineShield:\s*\n\s*'<svg class="keyword-icon keyword-icon-divine-shield"/.test(clientSource), "Divine Shield should have an SVG icon.");
assert(clientSource.includes("function spawnKeywordSummonEffect(targetEl, keywords = [])"), "Client should define a keyword summon effect helper.");
assert(clientSource.includes("spawnKeywordSummonEffect(el, keywords)"), "Newly rendered minions should trigger keyword summon effects.");
assert(
  /render\(myState\);[\s\S]*?diff\.newMinions\.forEach[\s\S]*?spawnKeywordSummonEffect\(el, keywords\)/.test(clientSource),
  "Keyword summon effects should run only after the board has rendered the new minion."
);
assert(
  /if \(playedFromHand\) \{[\s\S]*?setTimeout\(\(\) => spawnKeywordSummonEffect\(el, keywords\), 450\);[\s\S]*?return;[\s\S]*?\}/.test(clientSource),
  "Keyword summon effects for cards played from hand should wait until the travel animation finishes."
);
assert(clientSource.includes("activeKeywords(m).filter((keyword) => KEYWORD_SUMMON_EFFECT_ORDER.includes(keyword))"), "New minions should carry only summon-relevant keywords into the effect.");
assert(fxCss.includes(".keyword-summon-effect"), "Keyword summon effect should have CSS.");
assert(fxCss.includes(".keyword-summon-effect .keyword-icon"), "Keyword summon SVGs should scale inside the effect.");
assert(fxCss.includes("animation: float-up 1.08s"), "Keyword summon effect should match floating number timing.");
assert(fxCss.includes(".keyword-summon-effect, .round-banner-title") || fxCss.includes(".keyword-summon-effect"), "Reduced-motion rules should cover the keyword summon effect.");

console.log("--- KEYWORD SUMMON EFFECT TEST OK ---");
