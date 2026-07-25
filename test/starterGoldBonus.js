const assert = require("assert");
const {
  STARTER_GOLD_BONUS,
  grantStarterGoldToExistingUsers,
} = require("../server/db");

function createUsersCollection(docs) {
  return {
    async updateMany(filter, update) {
      assert.deepStrictEqual(filter, { starterGoldGranted: { $ne: true } });
      assert.strictEqual(update.$inc.gold, STARTER_GOLD_BONUS);
      assert.strictEqual(update.$set.starterGoldGranted, true);
      assert(update.$set.starterGoldGrantedAt instanceof Date);
      assert(update.$set.updatedAt instanceof Date);

      let modifiedCount = 0;
      for (const doc of docs) {
        if (doc.starterGoldGranted === true) continue;
        doc.gold = (doc.gold || 0) + update.$inc.gold;
        Object.assign(doc, update.$set);
        modifiedCount += 1;
      }
      return { matchedCount: modifiedCount, modifiedCount };
    },
  };
}

async function run() {
  const docs = [
    { discordId: "existing-without-flag", gold: 25 },
    { discordId: "already-granted", gold: 80, starterGoldGranted: true },
    { discordId: "explicit-false", gold: 0, starterGoldGranted: false },
  ];
  const db = {
    collection(name) {
      assert.strictEqual(name, "users");
      return createUsersCollection(docs);
    },
  };

  const firstRunAt = new Date("2026-07-25T12:00:00.000Z");
  const first = await grantStarterGoldToExistingUsers(db, firstRunAt);
  assert.strictEqual(first.modifiedCount, 2);
  assert.strictEqual(docs[0].gold, 25 + STARTER_GOLD_BONUS);
  assert.strictEqual(docs[0].starterGoldGranted, true);
  assert.strictEqual(docs[0].starterGoldGrantedAt, firstRunAt);
  assert.strictEqual(docs[1].gold, 80);
  assert.strictEqual(docs[2].gold, STARTER_GOLD_BONUS);

  const second = await grantStarterGoldToExistingUsers(db, new Date("2026-07-26T12:00:00.000Z"));
  assert.strictEqual(second.modifiedCount, 0);
  assert.strictEqual(docs[0].gold, 25 + STARTER_GOLD_BONUS);
  assert.strictEqual(docs[1].gold, 80);
  assert.strictEqual(docs[2].gold, STARTER_GOLD_BONUS);
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
