const assert = require("assert");
const { assertCardCanBeTraded } = require("../server/db");

const savedDeckUser = {
  cardCollection: { "base:aleex": 2, "base:barto": 1 },
  decks: [{ id: "deck-1", cardIds: ["base:aleex", "base:aleex"] }],
};

assert.doesNotThrow(
  () => assertCardCanBeTraded(savedDeckUser, "base:aleex", "base:aleex"),
  "Swapping the same card must preserve copies required by a saved deck."
);
assert.throws(
  () => assertCardCanBeTraded(savedDeckUser, "base:aleex", "base:barto"),
  /needed by one of your saved decks/,
  "Trading a deck copy for a different card must still be blocked."
);
assert.throws(
  () => assertCardCanBeTraded({ cardCollection: {}, decks: [] }, "base:aleex", "base:aleex"),
  /do not own that card/,
  "A player must still own a copy to offer it."
);

console.log("--- TRADE DECK PROTECTION TEST OK ---");
