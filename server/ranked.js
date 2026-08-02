const RANKS = [
  { id: "sand", name: "Sand", min: 0, color: "#8ddcff", icon: "*" },
  { id: "bronze", name: "Bronze", min: 400, color: "#c8875b", icon: "B" },
  { id: "gold", name: "Gold", min: 900, color: "#ffd166", icon: "*" },
  { id: "diamond", name: "Diamond", min: 1500, color: "#9de7ff", icon: "D" },
  { id: "master", name: "Master", min: 2200, color: "#d9a7ff", icon: "M" },
];

const RANKED_SCHEDULE = {
  Fri: { start: 18, end: 19, label: "Friday 18:00-19:00" },
  Sat: { start: 19, end: 20, label: "Saturday 19:00-20:00" },
  Sun: { start: 21, end: 22, label: "Sunday 21:00-22:00" },
};
const RANKED_WEEKLY_REWARDS = {
  sand: 0,
  bronze: 150,
  gold: 300,
  diamond: 600,
  master: 1200,
};
const CET_TIME_ZONE = "Etc/GMT-1";

function getRank(points = 0) {
  const value = Number.isFinite(Number(points)) ? Math.max(0, Number(points)) : 0;
  return RANKS.reduce((current, rank) => value >= rank.min ? rank : current, RANKS[0]);
}

function getRankIndex(points = 0) {
  const rank = getRank(points);
  return Math.max(0, RANKS.findIndex((entry) => entry.id === rank.id));
}

function rankedSeasonResetRating(points = 0, ranksToDrop = 2) {
  const currentIndex = getRankIndex(points);
  const targetIndex = Math.max(0, currentIndex - Math.max(0, Number(ranksToDrop) || 0));
  return RANKS[targetIndex].min;
}

function rankedRewardTiers() {
  return RANKS.map((rank) => ({ ...rank, rewardGold: RANKED_WEEKLY_REWARDS[rank.id] || 0 }));
}

function rankedSeason(now = new Date()) {
  const endsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { endsAt };
}

function zonedDate(year, month, day, hour, minute, timeZone = CET_TIME_ZONE) {
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  for (let index = 0; index < 3; index += 1) {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(guess);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const rendered = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour) % 24, Number(values.minute));
    guess = new Date(guess.getTime() + Date.UTC(year, month - 1, day, hour, minute) - rendered);
  }
  return guess;
}

function rankedWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: CET_TIME_ZONE, weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const minutes = Number(values.hour) * 60 + Number(values.minute);
  const paris = new Intl.DateTimeFormat("en-CA", { timeZone: CET_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const [year, month, date] = paris.split("-").map(Number);
  const currentSlot = RANKED_SCHEDULE[values.weekday];
  const label = "Friday 18:00-19:00 CET | Saturday 19:00-20:00 CET | Sunday 21:00-22:00 CET";

  if (currentSlot && minutes >= currentSlot.start * 60 && minutes < currentSlot.end * 60) {
    return { open: true, startsAt: zonedDate(year, month, date, currentSlot.start, 0), endsAt: zonedDate(year, month, date, currentSlot.end, 0), timeZone: "CET", schedule: RANKED_SCHEDULE, label };
  }

  const targetDate = new Date(Date.UTC(year, month - 1, date));
  for (let offset = 0; offset <= 7; offset += 1) {
    const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short" }).format(targetDate);
    const slot = RANKED_SCHEDULE[weekday];
    if (slot && (offset > 0 || minutes < slot.start * 60)) {
      return { open: false, startsAt: zonedDate(targetDate.getUTCFullYear(), targetDate.getUTCMonth() + 1, targetDate.getUTCDate(), slot.start, 0), endsAt: null, timeZone: "CET", schedule: RANKED_SCHEDULE, label };
    }
    targetDate.setUTCDate(targetDate.getUTCDate() + 1);
  }
  throw new Error("Could not find the next ranked window.");
}

module.exports = { RANKS, RANKED_SCHEDULE, RANKED_WEEKLY_REWARDS, getRank, rankedRewardTiers, rankedSeason, rankedSeasonResetRating, rankedWindow };

