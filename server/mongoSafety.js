const { ObjectId } = require("mongodb");

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const MONGO_KEY_SEGMENT_RE = /^[A-Za-z0-9:_-]{1,80}$/;
const DISCORD_ID_RE = /^\d{5,32}$/;
const DISCORD_AVATAR_RE = /^[A-Za-z0-9_]{1,128}$/;

function fail(message, code = "INVALID_INPUT") {
  const err = new Error(message);
  err.code = code;
  throw err;
}

function toObjectId(value, label = "id") {
  if (typeof value !== "string" || !OBJECT_ID_RE.test(value) || !ObjectId.isValid(value)) {
    fail(`Invalid ${label}.`, "INVALID_ID");
  }
  return new ObjectId(value);
}

function sanitizeString(value, { label = "value", fallback = "", max = 80, trim = true } = {}) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") fail(`Invalid ${label}.`);
  const normalized = trim ? value.trim() : value;
  return normalized.slice(0, max);
}

function assertMongoKeySegment(value, label = "key") {
  if (typeof value !== "string" || !MONGO_KEY_SEGMENT_RE.test(value)) {
    fail(`Invalid ${label}.`);
  }
  return value;
}

function assertPositiveInteger(value, label = "value", { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isInteger(value) || value < min || value > max) {
    fail(`Invalid ${label}.`);
  }
  return value;
}

function sanitizeDiscordProfile(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    fail("Invalid Discord profile.");
  }
  if (typeof profile.id !== "string" || !DISCORD_ID_RE.test(profile.id)) {
    fail("Invalid Discord id.");
  }
  const username = sanitizeString(profile.username, { label: "Discord username", max: 80 });
  const globalName =
    typeof profile.global_name === "string"
      ? sanitizeString(profile.global_name, { label: "Discord display name", max: 80 })
      : null;
  const avatar = profile.avatar == null ? null : sanitizeString(profile.avatar, { label: "Discord avatar", max: 128 });
  if (avatar && !DISCORD_AVATAR_RE.test(avatar)) fail("Invalid Discord avatar.");

  return {
    id: profile.id,
    username,
    global_name: globalName,
    avatar,
  };
}

module.exports = {
  assertMongoKeySegment,
  assertPositiveInteger,
  sanitizeDiscordProfile,
  sanitizeString,
  toObjectId,
};
