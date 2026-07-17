class TournamentMatchStartQueue {
  constructor({ concurrency = 2 } = {}) {
    if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("Tournament start concurrency must be at least one.");
    this.concurrency = concurrency;
    this.running = 0;
    this.jobs = [];
    this.keys = new Set();
  }

  enqueue(key, task) {
    if (typeof key !== "string" || !key || typeof task !== "function") throw new Error("A tournament match start needs a key and task.");
    if (this.keys.has(key)) return null;

    let resolve;
    let reject;
    const promise = new Promise((nextResolve, nextReject) => {
      resolve = nextResolve;
      reject = nextReject;
    });
    this.keys.add(key);
    this.jobs.push({ key, task, resolve, reject });
    const position = this.running + this.jobs.length;
    this.drain();
    return { promise, position };
  }

  drain() {
    while (this.running < this.concurrency && this.jobs.length) {
      const job = this.jobs.shift();
      this.running += 1;
      Promise.resolve()
        .then(job.task)
        .then(job.resolve, job.reject)
        .finally(() => {
          this.running -= 1;
          this.keys.delete(job.key);
          this.drain();
        });
    }
  }
}

module.exports = { TournamentMatchStartQueue };
