// Shared by the browser and server: a small, stat-driven progression catalog.
(function (root, factory) {
  const catalog = factory();
  if (typeof module === "object" && module.exports) module.exports = catalog;
  if (root) root.ArcaneProfileCatalog = catalog;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const TITLE_DEFINITIONS = [
    { id: "initiate", name: "Arcane Initiate", description: "The first mark of a duelist.", metric: "wins", target: 0 },
    { id: "first-blood", name: "First Blood", description: "Win your first duel.", metric: "wins", target: 1 },
    { id: "spellbreaker", name: "Spellbreaker", description: "Win 10 duels.", metric: "wins", target: 10 },
    { id: "duel-master", name: "Duel Master", description: "Win 50 duels.", metric: "wins", target: 50 },
    { id: "ranked-vanguard", name: "Ranked Vanguard", description: "Earn 5 quickplay victories.", metric: "quickplayWins", target: 5 },
    { id: "vault-keeper", name: "Vault Keeper", description: "Open 10 card packs.", metric: "packsOpened", target: 10 },
    { id: "gate-walker", name: "Gate Walker", description: "Complete a campaign once.", metric: "campaignWins", target: 1 },
    { id: "frostbound", name: "Frostbound", description: "Complete campaigns 3 times.", metric: "campaignWins", target: 3 },
    { id: "relic-keeper", name: "Relic Keeper", description: "Complete campaigns 10 times.", metric: "campaignWins", target: 10 },
    { id: "machine-breaker", name: "Machine Breaker", description: "Defeat the NPC 10 times.", metric: "npcWins", target: 10 },
    { id: "johnnys-bane", name: "Johnny's Bane", description: "Defeat Johnny in a multiplayer match.", metric: "johnnyWins", target: 1 },
  ];

  const ACHIEVEMENT_DEFINITIONS = [
    { id: "first-victory", name: "First Victory", description: "Win a duel.", metric: "wins", target: 1 },
    { id: "tenfold-triumph", name: "Tenfold Triumph", description: "Win 10 duels.", metric: "wins", target: 10 },
    { id: "ranked-awakening", name: "Ranked Awakening", description: "Win 5 quickplay duels.", metric: "quickplayWins", target: 5 },
    { id: "arcane-arsenal", name: "Arcane Arsenal", description: "Open 10 card packs.", metric: "packsOpened", target: 10 },
    { id: "seasoned-duelist", name: "Seasoned Duelist", description: "Play through 25 decided duels.", metric: "decided", target: 25 },
    { id: "unbroken-will", name: "Unbroken Will", description: "Reach 50 total victories.", metric: "wins", target: 50 },
    { id: "gate-opened", name: "Gate Opened", description: "Complete a campaign.", metric: "campaignWins", target: 1 },
    { id: "endless-winter", name: "Endless Winter", description: "Complete campaigns 10 times.", metric: "campaignWins", target: 10 },
    { id: "npc-slayer", name: "NPC Slayer", description: "Defeat the NPC 10 times.", metric: "npcWins", target: 10 },
    { id: "developer-down", name: "Developer Down", description: "Defeat Johnny in multiplayer.", metric: "johnnyWins", target: 1 },
    { id: "pack-apprentice", name: "Pack Apprentice", description: "Open 3 card packs.", metric: "packsOpened", target: 3 },
    { id: "thirty-triumphs", name: "Thirty Triumphs", description: "Win 30 duels.", metric: "wins", target: 30 },
    { id: "quickplay-regular", name: "Quickplay Regular", description: "Win 15 quickplay matches.", metric: "quickplayWins", target: 15 },
    { id: "campaign-veteran", name: "Campaign Veteran", description: "Complete campaigns 3 times.", metric: "campaignWins", target: 3 },
    { id: "bot-bane", name: "Bot Bane", description: "Defeat the NPC 3 times.", metric: "npcWins", target: 3 },
    { id: "collectors-sigil", name: "Collector's Sigil", description: "Open 25 card packs.", metric: "packsOpened", target: 25 },
  ];

  function value(value) {
    return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  }

  function normalizeStats(stats = {}) {
    const wins = value(stats.wins);
    const losses = value(stats.losses);
    return {
      wins,
      losses,
      surrenders: value(stats.surrenders),
      quickplayWins: value(stats.quickplayWins),
      packsOpened: value(stats.packsOpened),
      campaignWins: value(stats.campaignWins),
      npcWins: value(stats.npcWins),
      johnnyWins: value(stats.johnnyWins),
      decided: wins + losses,
    };
  }

  function metricValue(stats, metric) {
    return normalizeStats(stats)[metric] || 0;
  }

  function withProgress(definition, stats) {
    const current = metricValue(stats, definition.metric);
    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      current,
      target: definition.target,
      unlocked: current >= definition.target,
    };
  }

  function getProgress(stats, selectedTitleId, equippedBadgeIds = []) {
    const normalizedStats = normalizeStats(stats);
    const achievements = ACHIEVEMENT_DEFINITIONS.map((item) => withProgress(item, normalizedStats));
    const titles = TITLE_DEFINITIONS.map((item) => withProgress(item, normalizedStats));
    const selectedTitle = titles.find((item) => item.id === selectedTitleId && item.unlocked)
      || titles[0];
    const equippedBadgeIdsSafe = Array.isArray(equippedBadgeIds)
      ? [...new Set(equippedBadgeIds.filter((id) => typeof id === "string"))].slice(0, 3)
      : [];
    const equippedBadges = equippedBadgeIdsSafe
      .map((id) => achievements.find((achievement) => achievement.id === id && achievement.unlocked))
      .filter(Boolean);
    return { stats: normalizedStats, achievements, titles, selectedTitle, equippedBadges };
  }

  return { getProgress, normalizeStats, TITLE_DEFINITIONS, ACHIEVEMENT_DEFINITIONS };
});
