const DIRECTIONS = Object.freeze(["up", "right", "down", "left"]);

function boundedInteger(value, fallback, min, max) {
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

function normalizeShieldChallenge(definition = {}) {
  if (!definition || typeof definition !== "object") return null;
  if (typeof definition.cardId !== "string" || !definition.cardId.trim()) {
    throw new Error("Campaign shield challenge needs a card id.");
  }
  const arrowCount = boundedInteger(definition.arrowCount, 7, 3, 12);
  return Object.freeze({
    cardId: definition.cardId.trim(),
    arrowCount,
    maxArrowCount: boundedInteger(definition.maxArrowCount, Math.max(arrowCount, 12), arrowCount, 24),
    intervalMs: boundedInteger(definition.intervalMs, 620, 350, 1200),
    travelMs: boundedInteger(definition.travelMs, 850, 450, 1800),
    damagePerHit: boundedInteger(definition.damagePerHit, 1, 0, 5),
    arrowIncrease: boundedInteger(definition.arrowIncrease, 1, 0, 3),
    intervalReductionMs: boundedInteger(definition.intervalReductionMs, 55, 0, 200),
    minIntervalMs: boundedInteger(definition.minIntervalMs, 440, 260, 1200),
    travelReductionMs: boundedInteger(definition.travelReductionMs, 50, 0, 200),
    minTravelMs: boundedInteger(definition.minTravelMs, 650, 450, 1800),
  });
}

function scaleShieldChallenge(config, activationCount = 0) {
  const level = Math.max(0, Number.isInteger(activationCount) ? activationCount : 0);
  return {
    ...config,
    arrowCount: Math.min(config.maxArrowCount, config.arrowCount + level * config.arrowIncrease),
    intervalMs: Math.max(config.minIntervalMs, config.intervalMs - level * config.intervalReductionMs),
    travelMs: Math.max(config.minTravelMs, config.travelMs - level * config.travelReductionMs),
  };
}

function createShieldChallenge(config, { randomInt, now = Date.now() } = {}) {
  const random = typeof randomInt === "function" ? randomInt : (max) => Math.floor(Math.random() * max);
  const startAt = now + 900;
  const arrows = Array.from({ length: config.arrowCount }, (_, index) => ({
    direction: DIRECTIONS[random(DIRECTIONS.length)],
    impactAt: startAt + config.travelMs + index * config.intervalMs,
  }));
  return {
    id: `shield-${now}-${random(1_000_000)}`,
    startsAt: startAt,
    endsAt: arrows[arrows.length - 1].impactAt + 120,
    arrows,
    damagePerHit: config.damagePerHit,
    initialDirection: "down",
    inputs: [],
  };
}

function recordShieldInput(challenge, direction, at = Date.now()) {
  if (!challenge || !DIRECTIONS.includes(direction)) return false;
  if (!Number.isFinite(at) || at < challenge.startsAt - 300 || at > challenge.endsAt) return false;
  challenge.inputs.push({ direction, at });
  return true;
}

function directionAt(challenge, at) {
  let direction = challenge.initialDirection || null;
  for (const input of challenge.inputs) {
    if (input.at > at) break;
    direction = input.direction;
  }
  return direction;
}

function resolveShieldChallenge(challenge) {
  const blocked = [];
  let hits = 0;
  challenge.arrows.forEach((arrow) => {
    const didBlock = directionAt(challenge, arrow.impactAt) === arrow.direction;
    blocked.push(didBlock);
    if (!didBlock) hits += 1;
  });
  return {
    hits,
    blocked: blocked.filter(Boolean).length,
    damage: hits * challenge.damagePerHit,
  };
}

module.exports = {
  DIRECTIONS,
  normalizeShieldChallenge,
  scaleShieldChallenge,
  createShieldChallenge,
  recordShieldInput,
  resolveShieldChallenge,
};
