const locks = new Map();

async function withUserLock(userId, task) {
  const key = String(userId);
  const previous = locks.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const entry = previous.then(() => current);
  locks.set(key, entry);

  await previous;
  try {
    return await task();
  } finally {
    release();
    if (locks.get(key) === entry) locks.delete(key);
  }
}

async function withUserLocks(userIds, task) {
  const uniqueIds = [...new Set(userIds.map(String))].sort();
  return uniqueIds.reduceRight((next, userId) => () => withUserLock(userId, next), task)();
}

module.exports = {
  withUserLock,
  withUserLocks,
};
