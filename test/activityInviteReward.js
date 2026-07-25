const assert = require("assert");
const {
  DISCORD_ACTIVITY_INVITE_GOLD,
  grantDiscordActivityInviteReward,
} = require("../server/db");

function getPath(doc, path) {
  return path.split(".").reduce((value, part) => value?.[part], doc);
}

function setPath(doc, path, value) {
  const parts = path.split(".");
  let target = doc;
  for (const part of parts.slice(0, -1)) {
    target[part] = target[part] || {};
    target = target[part];
  }
  target[parts[parts.length - 1]] = value;
}

function createDb(doc) {
  return {
    collection(name) {
      assert.strictEqual(name, "users");
      return {
        async updateOne(filter, update) {
          assert.strictEqual(String(filter._id), doc._id);
          assert.deepStrictEqual(filter["economy.discordActivityInviteRewardClaimed"], { $ne: true });
          assert.strictEqual(update.$inc.gold, DISCORD_ACTIVITY_INVITE_GOLD);
          assert(update.$set["economy.discordActivityInviteRewardClaimedAt"] instanceof Date);
          assert(update.$set.updatedAt instanceof Date);

          if (getPath(doc, "economy.discordActivityInviteRewardClaimed") === true) {
            return { matchedCount: 0, modifiedCount: 0 };
          }

          doc.gold = (doc.gold || 0) + update.$inc.gold;
          for (const [path, value] of Object.entries(update.$set)) setPath(doc, path, value);
          return { matchedCount: 1, modifiedCount: 1 };
        },
        async findOne(filter) {
          assert.strictEqual(String(filter._id), doc._id);
          return { gold: doc.gold };
        },
      };
    },
  };
}

async function run() {
  const doc = {
    _id: "507f1f77bcf86cd799439011",
    gold: 20,
    economy: {},
  };
  const db = createDb(doc);

  const first = await grantDiscordActivityInviteReward(doc._id, db, new Date("2026-07-25T12:00:00.000Z"));
  assert.strictEqual(first.claimed, true);
  assert.strictEqual(first.goldAwarded, DISCORD_ACTIVITY_INVITE_GOLD);
  assert.strictEqual(first.gold, 20 + DISCORD_ACTIVITY_INVITE_GOLD);
  assert.strictEqual(doc.economy.discordActivityInviteRewardClaimed, true);

  const second = await grantDiscordActivityInviteReward(doc._id, db, new Date("2026-07-26T12:00:00.000Z"));
  assert.strictEqual(second.claimed, false);
  assert.strictEqual(second.goldAwarded, 0);
  assert.strictEqual(second.gold, 20 + DISCORD_ACTIVITY_INVITE_GOLD);
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
