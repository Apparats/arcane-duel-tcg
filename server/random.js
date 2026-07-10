const crypto = require("crypto");

const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function secureRandomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1) throw new Error("Invalid random range.");
  return crypto.randomInt(maxExclusive);
}

function secureRandomFrom(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("Cannot select from an empty list.");
  return items[secureRandomInt(items.length)];
}

function secureRandomCode(length, alphabet = ALPHANUMERIC) {
  if (!Number.isInteger(length) || length < 1 || length > 128 || typeof alphabet !== "string" || alphabet.length < 2) {
    throw new Error("Invalid random code configuration.");
  }
  return Array.from({ length }, () => alphabet[secureRandomInt(alphabet.length)]).join("");
}

function secureRandomId(bytes = 16) {
  if (!Number.isInteger(bytes) || bytes < 8 || bytes > 64) throw new Error("Invalid random id length.");
  return crypto.randomBytes(bytes).toString("base64url");
}

module.exports = {
  secureRandomCode,
  secureRandomFrom,
  secureRandomId,
  secureRandomInt,
};
