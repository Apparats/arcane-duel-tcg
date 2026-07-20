const { normalizeDisplayName } = require("../server/db");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(normalizeDisplayName("Arcane_Duelist42") === "Arcane_Duelist42", "Valid usernames must be accepted.");

["", "with space", "slash/name", "accentué", "name!", "a".repeat(25)].forEach((value) => {
  let rejected = false;
  try {
    normalizeDisplayName(value);
  } catch {
    rejected = true;
  }
  assert(rejected, `Username ${JSON.stringify(value)} must be rejected.`);
});

console.log("--- DISPLAY NAME TEST OK ---");
