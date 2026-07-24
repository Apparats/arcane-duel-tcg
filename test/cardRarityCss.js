const assert = require("assert");
const fs = require("fs");

const cardsCss = fs.readFileSync("public/css/cards.css", "utf8");
const handCss = fs.readFileSync("public/css/board-hand.css", "utf8");
const combined = `${cardsCss}\n${handCss}`;

assert(!/var\(\s*#/.test(combined), "CSS custom properties must not wrap raw hex colors in var().");
assert(!/var\(\s*\d/.test(combined), "CSS custom properties must not wrap raw RGB channel lists in var().");
assert(/\.minion-card\.rarity-legendary,[\s\S]*?border-color: #ffa700/.test(cardsCss), "Legendary cards should use the pronounced gold border.");
assert(/\.minion-card\.rarity-mythic,[\s\S]*?border-color: #df1500/.test(cardsCss), "Mythic cards should use the pronounced red border.");

console.log("--- CARD RARITY CSS TEST OK ---");
