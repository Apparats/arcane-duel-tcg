// Shared by the browser and server: a small, stat-driven progression catalog.
(function (root, factory) {
  const cards = typeof module === "object" && module.exports
    ? require("./cards")
    : root?.TCGCards;
  const catalog = factory(cards);
  if (typeof module === "object" && module.exports) module.exports = catalog;
  if (root) root.ArcaneProfileCatalog = catalog;
})(typeof window !== "undefined" ? window : globalThis, function (cards) {
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
    { id: "tournament-sovereign", name: "Tournament Sovereign", description: "Claim first place in an Arcana tournament.", metric: "tournamentWins", target: 1 },
    { id: "quickplay-apex", name: "Quickplay Apex", description: "Reach #1 in the quickplay ranking.", metric: "quickplayTop1", target: 1 },
    { id: "lord-of-the-cards", name: "Lord of the Cards", description: "Purchased from the shop.", purchasable: true, shopType: "title" },
    { id: "more-than-honorable", name: "More than honorable", description: "You helped the developer with the game.", supporterOnly: true },
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
    { id: "crown-of-arcana", name: "Crown of Arcana", description: "Win an official Arcana tournament.", metric: "tournamentWins", target: 1 },
    { id: "pack-apprentice", name: "Pack Apprentice", description: "Open 3 card packs.", metric: "packsOpened", target: 3 },
    { id: "thirty-triumphs", name: "Thirty Triumphs", description: "Win 30 duels.", metric: "wins", target: 30 },
    { id: "quickplay-regular", name: "Quickplay Regular", description: "Win 15 quickplay matches.", metric: "quickplayWins", target: 15 },
    { id: "campaign-veteran", name: "Campaign Veteran", description: "Complete campaigns 3 times.", metric: "campaignWins", target: 3 },
    { id: "bot-bane", name: "Bot Bane", description: "Defeat the NPC 3 times.", metric: "npcWins", target: 3 },
    { id: "collectors-sigil", name: "Collector's Sigil", description: "Open 25 card packs.", metric: "packsOpened", target: 25 },
    { id: "mythic-constellation", name: "Mythic Constellation", description: "Collect 10 different Mythic cards.", metric: "mythicCards", target: 10 },
    { id: "ranking-elite", name: "Ranking Elite", description: "Reach the top 5 of the quickplay ranking.", metric: "quickplayTop5", target: 1 },
    { id: "ranking-apex", name: "Ranking Apex", description: "Reach #1 in the quickplay ranking.", metric: "quickplayTop1", target: 1 },
    { id: "base-archivist", name: "Base Archivist", description: "Collect every card from the base expansion.", expansionId: "base" },
    { id: "expansion-one-archivist", name: "Expansion 1 Archivist", description: "Collect every card from Expansion 1.", expansionId: "expansion1" },
    { id: "unchained-conqueror", name: "Unchained Conqueror", description: "Defeat TheUnchained.", metric: "unchainedWins", target: 1 },
    { id: "gold-hoarder", name: "Gold Hoarder", description: "Purchased from the shop with accumulated gold.", purchasable: true, shopType: "achievement" },
    { id: "more-than-honorable", name: "More than honorable", description: "You helped the developer with the game.", supporterOnly: true },
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
      unchainedWins: value(stats.unchainedWins),
      npcWins: value(stats.npcWins),
      johnnyWins: value(stats.johnnyWins),
      tournamentWins: value(stats.tournamentWins),
      decided: wins + losses,
    };
  }

  function metricValue(stats, metric) {
    return normalizeStats(stats)[metric] || 0;
  }

  function mythicCollectionCount(options = {}) {
    const collection = options.cardCollection && typeof options.cardCollection === "object"
      ? options.cardCollection
      : {};
    const unlockedCards = Array.isArray(options.unlockedCards) ? options.unlockedCards : [];
    const ownedIds = new Set([
      ...Object.entries(collection)
        .filter(([, quantity]) => value(quantity) > 0)
        .map(([cardId]) => cardId),
      ...unlockedCards.filter((cardId) => typeof cardId === "string"),
    ]);
    return [...ownedIds].filter((cardId) => cards?.getCardById?.(cardId)?.rarity === "mythic").length;
  }

  function ownedCardIds(options = {}) {
    const collection = options.cardCollection && typeof options.cardCollection === "object"
      ? options.cardCollection
      : {};
    const unlockedCards = Array.isArray(options.unlockedCards) ? options.unlockedCards : [];
    return new Set([
      ...Object.entries(collection)
        .filter(([, quantity]) => value(quantity) > 0)
        .map(([cardId]) => cardId),
      ...unlockedCards.filter((cardId) => typeof cardId === "string"),
    ]);
  }

  function cardExpansionId(card) {
    return card?._expansionId || String(card?.id || "").split(":")[0];
  }

  function expansionCollectionProgress(expansionId, options = {}) {
    const expansionCards = (cards?.CARDS || [])
      .filter((card) => card?.showInInventory !== false && cardExpansionId(card) === expansionId);
    const ownedIds = ownedCardIds(options);
    return {
      current: expansionCards.filter((card) => ownedIds.has(card.id)).length,
      target: expansionCards.length || 1,
    };
  }

  function quickplayRankProgress(options = {}, limit = 1) {
    const currentRank = value(options.quickplayRank);
    const bestRank = value(options.bestQuickplayRank ?? options.quickplayBestRank);
    const rank = bestRank > 0 && currentRank > 0
      ? Math.min(bestRank, currentRank)
      : bestRank || currentRank;
    return rank > 0 && rank <= limit ? 1 : 0;
  }

  function withProgress(definition, stats, options = {}) {
    const purchasedAchievementIds = Array.isArray(options.purchasedAchievementIds) ? options.purchasedAchievementIds : [];
    const purchasedTitleIds = Array.isArray(options.purchasedTitleIds) ? options.purchasedTitleIds : [];
    const purchasedIds = definition.shopType === "achievement"
      ? purchasedAchievementIds
      : definition.shopType === "title"
        ? purchasedTitleIds
        : [];
    const expansionProgress = definition.expansionId
      ? expansionCollectionProgress(definition.expansionId, options)
      : null;
    const current = expansionProgress
      ? expansionProgress.current
      : definition.purchasable
      ? (purchasedIds.includes(definition.id) ? 1 : 0)
      : definition.supporterOnly
      ? (options.supporter === true ? 1 : 0)
      : definition.metric === "quickplayTop1"
        ? quickplayRankProgress(options, 1)
      : definition.metric === "quickplayTop5"
        ? quickplayRankProgress(options, 5)
      : definition.metric === "mythicCards"
        ? mythicCollectionCount(options)
      : metricValue(stats, definition.metric);
    const target = expansionProgress
      ? expansionProgress.target
      : definition.purchasable ? 1
      : definition.supporterOnly ? 1 : definition.target;
    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      current,
      target,
      unlocked: current >= target,
    };
  }

  function getProgress(stats, selectedTitleId, equippedBadgeIds = [], options = {}) {
    const normalizedStats = normalizeStats(stats);
    const achievements = ACHIEVEMENT_DEFINITIONS.map((item) => withProgress(item, normalizedStats, options));
    const titles = TITLE_DEFINITIONS.map((item) => withProgress(item, normalizedStats, options));
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

  return { getProgress, normalizeStats, mythicCollectionCount, expansionCollectionProgress, TITLE_DEFINITIONS, ACHIEVEMENT_DEFINITIONS };
});
