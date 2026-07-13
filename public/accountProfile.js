// Dedicated player profile screen: rendering, lookup, and title selection.
(function () {
  let fetcher = null;
  let getAccountState = null;
  let notify = null;
  let changeScreen = null;
  let currentUser = null;
  let activeProfile = null;
  let activeTab = "achievements";
  let activeStatsMode = "quickplay";
  let searchRun = 0;
  let eventsBound = false;
  const PROGRESS_SEEN_STORAGE_PREFIX = "arcana_profile_progress_seen_";
  let observedProgressUserId = null;
  let observedProgressIds = new Set();
  const unlockNotificationQueue = [];
  let unlockNotificationShowing = false;

  const $ = (id) => document.getElementById(id);

  function number(value) {
    return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(number(value));
  }

  function initialsFor(name) {
    const parts = String(name || "Player").trim().split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : (parts[0] || "P").slice(0, 2)).toUpperCase();
  }

  function normalizedStats(profile) {
    const stats = profile?.stats || {};
    return {
      wins: number(stats.wins),
      losses: number(stats.losses),
      surrenders: number(stats.surrenders),
      quickplayWins: number(stats.quickplayWins),
      packsOpened: number(stats.packsOpened),
    };
  }

  function statsForMode(profile, mode) {
    const stored = profile?.modeStats || {};
    const normalize = (stats) => ({
      wins: number(stats?.wins),
      losses: number(stats?.losses),
      draws: number(stats?.draws),
      surrenders: number(stats?.surrenders),
    });
    const modes = {
      singleplayer: normalize(stored.singleplayer),
      oneVsOne: normalize(stored.oneVsOne),
      quickplay: normalize(stored.quickplay),
    };
    const total = (field) => Object.values(modes).reduce((sum, stats) => sum + stats[field], 0);
    const legacy = normalizedStats(profile);

    // Older accounts only have a global record, so keep its unclassified
    // portion visible in Quickplay until each match has a saved mode.
    modes.quickplay.wins += Math.max(0, legacy.wins - total("wins"), legacy.quickplayWins - modes.quickplay.wins);
    modes.quickplay.losses += Math.max(0, legacy.losses - total("losses"));
    modes.quickplay.surrenders += Math.max(0, legacy.surrenders - total("surrenders"));
    return modes[mode] || modes.quickplay;
  }

  function winRate(stats) {
    const decided = stats.wins + stats.losses;
    return decided > 0 ? Math.round((stats.wins / decided) * 100) : 0;
  }

  function getCurrentUser() {
    return getAccountState?.()?.user || currentUser;
  }

  function isCurrentUser(profile) {
    const current = getCurrentUser();
    return Boolean(current?.id && profile?.id && String(current.id) === String(profile.id));
  }

  function enrichProfile(profile) {
    if (!profile) return null;
    const catalog = window.ArcaneProfileCatalog;
    const progress = catalog?.getProgress(profile.stats, profile.selectedTitle?.id || profile.selectedTitle, profile.equippedBadgeIds);
    return {
      ...profile,
      stats: progress?.stats || normalizedStats(profile),
      achievements: profile.achievements || progress?.achievements || [],
      titles: profile.titles || progress?.titles || [],
      equippedBadges: profile.equippedBadges || progress?.equippedBadges || [],
      selectedTitle: typeof profile.selectedTitle === "object"
        ? profile.selectedTitle
        : progress?.selectedTitle || { name: "Arcane Initiate" },
    };
  }

  function setAvatar(imgEl, fallbackEl, profile) {
    if (!imgEl || !fallbackEl) return;
    fallbackEl.textContent = initialsFor(profile?.username);
    const avatarUrl = profile?.avatarUrl;
    imgEl.onload = null;
    imgEl.onerror = null;
    if (!avatarUrl) {
      imgEl.removeAttribute("src");
      imgEl.classList.add("hidden");
      fallbackEl.classList.remove("hidden");
      return;
    }
    fallbackEl.classList.remove("hidden");
    imgEl.classList.add("hidden");
    imgEl.onload = () => {
      imgEl.classList.remove("hidden");
      fallbackEl.classList.add("hidden");
    };
    imgEl.onerror = () => {
      imgEl.removeAttribute("src");
      imgEl.classList.add("hidden");
      fallbackEl.classList.remove("hidden");
    };
    imgEl.src = avatarUrl;
    if (imgEl.complete && imgEl.naturalWidth > 0) imgEl.onload();
  }

  function syncUser(user) {
    if (!user) return;
    const account = getAccountState?.();
    if (account?.user) account.user = { ...account.user, ...user };
    currentUser = { ...(account?.user || currentUser || {}), ...user };
    refreshProgressIndicator(currentUser);
    detectNewProgress(currentUser);
    setAvatar($("accountAvatar"), $("accountAvatarFallback"), currentUser);
    $("accountProfile")?.classList.remove("hidden");
    if (activeProfile && isCurrentUser(activeProfile)) renderProfile({ ...activeProfile, ...currentUser });
  }

  function statCard(label, value, note) {
    const card = document.createElement("article");
    card.className = "profile-stat-card";
    card.innerHTML = `<span class="profile-stat-label">${label}</span><strong class="profile-stat-value">${value}</strong><span class="profile-stat-note">${note}</span>`;
    return card;
  }

  function renderStats(profile) {
    const grid = $("profileStatsGrid");
    if (!grid) return;
    const stats = statsForMode(profile, activeStatsMode);
    grid.replaceChildren(
      statCard("Wins", formatNumber(stats.wins), "Victories"),
      statCard("Losses", formatNumber(stats.losses), "Defeats"),
      statCard("Win rate", `${winRate(stats)}%`, "Wins vs losses"),
      statCard("Draws", formatNumber(stats.draws), "Tied matches"),
      statCard("Surrenders", formatNumber(stats.surrenders), "Conceded matches")
    );
  }

  function setStatsMode(mode) {
    activeStatsMode = mode;
    document.querySelectorAll("[data-stat-mode]").forEach((button) => {
      const selected = button.dataset.statMode === mode;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    if (activeProfile) renderStats(activeProfile);
  }

  function progressCard(item, kind) {
    const card = document.createElement("article");
    card.className = `profile-progress-card ${item.unlocked ? "is-unlocked" : "is-locked"}`;
    const mark = document.createElement("span");
    mark.className = "profile-progress-mark";
    if (kind === "achievement") {
      mark.innerHTML = window.ArcaneProfileBadges?.badgeMarkup(item.id, item.unlocked)
        || `<span aria-hidden="true">${item.unlocked ? "*" : "?"}</span>`;
    }
    const copy = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = item.name;
    const description = document.createElement("p");
    description.textContent = item.description;
    const progress = document.createElement("span");
    progress.className = "profile-progress-count";
    progress.textContent = item.unlocked ? "Unlocked" : `${formatNumber(item.current)} / ${formatNumber(item.target)}`;
    copy.append(name, description, progress);
    if (kind === "achievement") card.append(mark, copy);
    else card.append(copy);
    if (kind === "title") card.classList.add("profile-title-card");
    return card;
  }

  function renderAchievements(profile) {
    const container = $("profileAchievements");
    if (!container) return;
    const achievements = profile.achievements || [];
    const own = isCurrentUser(profile);
    const equippedIds = new Set((profile.equippedBadges || []).map((badge) => badge.id));
    container.replaceChildren(...achievements.map((achievement) => {
      const card = progressCard(achievement, "achievement");
      if (own && achievement.unlocked) {
        const button = document.createElement("button");
        button.className = "profile-badge-select";
        button.type = "button";
        button.textContent = equippedIds.has(achievement.id) ? "Unequip" : "Equip badge";
        button.addEventListener("click", () => toggleBadge(achievement.id));
        card.append(button);
      }
      return card;
    }));
    const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
    $("profileUnlockSummary").textContent = `${unlocked} / ${achievements.length} achievements unlocked`;
  }

  function renderTitles(profile) {
    const container = $("profileTitles");
    if (!container) return;
    const own = isCurrentUser(profile);
    const selectedId = profile.selectedTitle?.id;
    container.replaceChildren(...(profile.titles || []).map((title) => {
      const card = progressCard(title, "title");
      card.classList.toggle("is-selected", title.id === selectedId);
      if (!own || !title.unlocked) return card;
      const button = document.createElement("button");
      button.className = "profile-title-select";
      button.type = "button";
      button.textContent = title.id === selectedId ? "Equipped" : "Equip";
      button.disabled = title.id === selectedId;
      button.addEventListener("click", () => selectTitle(title.id));
      card.append(button);
      return card;
    }));
    $("profileTitlesHint").textContent = own
      ? "Choose an unlocked title to carry into your public profile."
      : "Titles are earned through duels and collection progress.";
  }

  function ownedCards(profile) {
    const cards = window.TCGCards?.CARDS || [];
    const collection = profile?.cardCollection || {};
    const unlocked = new Set(profile?.unlockedCards || []);
    return cards
      .filter((card) => card.showInInventory !== false)
      .map((card) => ({
        card,
        quantity: Object.prototype.hasOwnProperty.call(collection, card.id) ? number(collection[card.id]) : unlocked.has(card.id) ? 1 : 0,
      }))
      .filter(({ quantity }) => quantity > 0)
      .sort((left, right) => left.card.name.localeCompare(right.card.name));
  }

  function renderCards(profile) {
    const container = $("profileCards");
    if (!container) return;
    $("profileCollectionSection")?.classList.remove("hidden");
    const cards = ownedCards(profile).sort((left, right) => left.card.cost - right.card.cost || left.card.name.localeCompare(right.card.name));
    const copies = cards.reduce((total, entry) => total + entry.quantity, 0);
    $("profileCardsSummary").textContent = cards.length
      ? `${formatNumber(cards.length)} unique cards - ${formatNumber(copies)} total copies`
      : "No cards collected yet.";
    if (cards.length === 0) {
      const empty = document.createElement("div");
      empty.className = "profile-card-list-empty";
      empty.textContent = "No cards collected yet.";
      container.replaceChildren(empty);
      return;
    }
    container.replaceChildren(...cards.map(({ card, quantity }) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = `profile-card-row ${typeof rarityClass === "function" ? rarityClass(card) : ""}`;
      element.title = "View card details";
      const cost = document.createElement("span");
      cost.className = "profile-card-cost";
      cost.textContent = card.cost;
      const name = document.createElement("span");
      name.className = "profile-card-name";
      name.textContent = card.name;
      const meta = document.createElement("span");
      meta.className = "profile-card-meta";
      meta.textContent = card.type === "minion" ? `${card.attack} / ${card.health}` : "Spell";
      const count = document.createElement("span");
      count.className = "profile-card-count";
      count.textContent = `x${formatNumber(quantity)}`;
      const open = document.createElement("span");
      open.className = "profile-card-open";
      open.setAttribute("aria-hidden", "true");
      open.textContent = ">";
      element.append(cost, name, meta, count, open);
      element.addEventListener("click", () => {
        if (typeof openCardZoom === "function") openCardZoom(card);
        else notify?.(card.name);
      });
      return element;
    }));
  }

  function unlockedProgressIds(user) {
    const progress = window.ArcaneProfileCatalog?.getProgress(user?.stats, user?.selectedTitle?.id || user?.selectedTitle, user?.equippedBadgeIds);
    if (!progress) return [];
    return [...progress.achievements, ...progress.titles]
      .filter((item) => item.unlocked && item.id !== "initiate")
      .map((item) => item.id)
      .sort();
  }

  function progressStorageKey(user) {
    return user?.id ? `${PROGRESS_SEEN_STORAGE_PREFIX}${user.id}` : null;
  }

  function readSeenProgress(user) {
    const key = progressStorageKey(user);
    if (!key) return null;
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : null;
    } catch (error) {
      return null;
    }
  }

  function writeSeenProgress(user, ids) {
    const key = progressStorageKey(user);
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(ids));
    } catch (error) {
      // Progress indicators remain optional when browser storage is unavailable.
    }
  }

  function refreshProgressIndicator(user) {
    const dot = $("accountProfileProgressDot");
    if (!dot || !user?.id) return;
    const unlocked = unlockedProgressIds(user);
    const seen = readSeenProgress(user);
    if (!seen) {
      writeSeenProgress(user, unlocked);
      dot.classList.add("hidden");
      return;
    }
    dot.classList.toggle("hidden", !unlocked.some((id) => !seen.includes(id)));
  }

  function markProgressSeen(user) {
    writeSeenProgress(user, unlockedProgressIds(user));
    $("accountProfileProgressDot")?.classList.add("hidden");
  }

  function detectNewProgress(user) {
    const progress = window.ArcaneProfileCatalog?.getProgress(user?.stats, user?.selectedTitle?.id || user?.selectedTitle, user?.equippedBadgeIds);
    if (!progress || !user?.id) return;
    const unlocked = [
      ...progress.achievements.filter((item) => item.unlocked).map((item) => ({ id: `achievement:${item.id}`, kind: "Achievement unlocked", item })),
      ...progress.titles.filter((item) => item.unlocked && item.id !== "initiate").map((item) => ({ id: `title:${item.id}`, kind: "Title unlocked", item })),
    ];
    const ids = new Set(unlocked.map((entry) => entry.id));
    if (observedProgressUserId !== user.id) {
      observedProgressUserId = user.id;
      observedProgressIds = ids;
      return;
    }
    unlocked.filter((entry) => !observedProgressIds.has(entry.id)).forEach(queueUnlockNotification);
    observedProgressIds = ids;
  }

  function queueUnlockNotification(entry) {
    unlockNotificationQueue.push(entry);
    showNextUnlockNotification();
  }

  function showNextUnlockNotification() {
    if (unlockNotificationShowing || unlockNotificationQueue.length === 0) return;
    const region = $("profileUnlockNotifications");
    if (!region) return;
    const entry = unlockNotificationQueue.shift();
    unlockNotificationShowing = true;
    const toast = document.createElement("article");
    toast.className = "profile-unlock-toast";
    const mark = document.createElement("span");
    mark.className = "profile-unlock-mark";
    if (entry.id.startsWith("achievement:")) {
      mark.innerHTML = window.ArcaneProfileBadges?.badgeMarkup(entry.item.id, true) || "*";
    } else {
      const titleMark = document.createElement("span");
      titleMark.className = "profile-unlock-title-mark";
      titleMark.textContent = "+";
      mark.append(titleMark);
    }
    const copy = document.createElement("div");
    copy.className = "profile-unlock-copy";
    const kind = document.createElement("span");
    kind.className = "profile-unlock-kind";
    kind.textContent = entry.kind;
    const name = document.createElement("strong");
    name.className = "profile-unlock-name";
    name.textContent = entry.item.name;
    copy.append(kind, name);
    toast.append(mark, copy);
    region.replaceChildren(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => {
      toast.classList.add("is-leaving");
      setTimeout(() => {
        toast.remove();
        unlockNotificationShowing = false;
        showNextUnlockNotification();
      }, 380);
    }, 3600);
  }

  function setActiveTab(tab) {
    activeTab = tab;
    document.querySelectorAll("[data-profile-tab]").forEach((button) => {
      const selected = button.dataset.profileTab === tab;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    $("profileAchievementsPanel")?.classList.toggle("hidden", tab !== "achievements");
    $("profileTitlesPanel")?.classList.toggle("hidden", tab !== "titles");
  }

  function renderProfile(profile) {
    const current = getCurrentUser();
    const merged = isCurrentUser(profile) ? { ...profile, ...current, gold: current?.gold ?? profile.gold } : profile;
    activeProfile = enrichProfile(merged);
    if (!activeProfile) return;
    const stats = normalizedStats(activeProfile);
    const own = isCurrentUser(activeProfile);
    $("profilePageName").textContent = activeProfile.username || "Player";
    $("profilePageSubtitle").textContent = own ? "Your Arcana account" : "Player profile";
    $("profilePageTitle").textContent = activeProfile.selectedTitle?.name || "Arcane Initiate";
    renderEquippedBadges(activeProfile);
    $("profilePageGold").textContent = own ? `${formatNumber(activeProfile.gold)} gold` : "Public profile";
    $("profilePageRecord").textContent = `${formatNumber(stats.wins)}W / ${formatNumber(stats.losses)}L`;
    $("btnViewOwnProfile")?.classList.toggle("hidden", own);
    setAvatar($("profilePageAvatar"), $("profilePageAvatarFallback"), activeProfile);
    renderStats(activeProfile);
    renderAchievements(activeProfile);
    renderTitles(activeProfile);
    renderCards(activeProfile);
    setActiveTab(activeTab);
  }

  function renderEquippedBadges(profile) {
    const container = $("profileEquippedBadges");
    if (!container) return;
    const badges = profile.equippedBadges || [];
    container.replaceChildren(...badges.map((badge) => {
      const badgeEl = document.createElement("span");
      badgeEl.className = "profile-equipped-badge";
      badgeEl.title = badge.name;
      badgeEl.innerHTML = window.ArcaneProfileBadges?.badgeMarkup(badge.id, true) || badge.name;
      return badgeEl;
    }));
    container.classList.toggle("hidden", badges.length === 0);
  }

  async function loadProfile(id) {
    if (!fetcher || !id) return;
    try {
      const response = await fetcher(`/players/${encodeURIComponent(id)}/profile`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load this profile.");
      renderProfile(data.profile);
    } catch (error) {
      notify?.(error.message || "Could not load this profile.");
    }
  }

  async function selectTitle(titleId) {
    if (!fetcher || !isCurrentUser(activeProfile)) return;
    try {
      const response = await fetcher("/account/title", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not equip this title.");
      const selectedTitle = data.profile?.selectedTitle;
      syncUser({ selectedTitle: selectedTitle?.id || "initiate" });
      renderProfile(data.profile);
      notify?.(`${selectedTitle?.name || "Title"} equipped.`);
    } catch (error) {
      notify?.(error.message || "Could not equip this title.");
    }
  }

  async function toggleBadge(achievementId) {
    if (!fetcher || !isCurrentUser(activeProfile)) return;
    const equippedIds = (activeProfile.equippedBadges || []).map((badge) => badge.id);
    const nextIds = equippedIds.includes(achievementId)
      ? equippedIds.filter((id) => id !== achievementId)
      : [...equippedIds, achievementId];
    if (nextIds.length > 3) return notify?.("You can equip up to three achievement badges.");
    try {
      const response = await fetcher("/account/badges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievementIds: nextIds }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update achievement badges.");
      const equippedBadgeIds = (data.profile?.equippedBadges || []).map((badge) => badge.id);
      syncUser({ equippedBadgeIds });
      renderProfile(data.profile);
    } catch (error) {
      notify?.(error.message || "Could not update achievement badges.");
    }
  }

  function setSearchStatus(message) {
    const status = $("playerSearchStatus");
    if (status) status.textContent = message;
  }

  function setSearchPopoverOpen(open) {
    $("playerSearchPopover")?.classList.toggle("hidden", !open);
  }

  function renderSearchResults(players) {
    const results = $("playerSearchResults");
    if (!results) return;
    results.replaceChildren(...players.map((player) => {
      const stats = normalizedStats(player);
      const button = document.createElement("button");
      button.className = "player-result";
      button.type = "button";
      const avatar = player.avatarUrl ? document.createElement("img") : document.createElement("span");
      avatar.className = "player-result-avatar";
      if (player.avatarUrl) avatar.src = player.avatarUrl;
      else avatar.textContent = initialsFor(player.username);
      const copy = document.createElement("span");
      copy.className = "player-result-copy";
      const name = document.createElement("strong");
      name.textContent = `${player.username || "Player"}${isCurrentUser(player) ? " (You)" : ""}`;
      const title = document.createElement("span");
      title.textContent = player.selectedTitle?.name || "Arcane Initiate";
      copy.append(name, title);
      const record = document.createElement("span");
      record.className = "player-result-record";
      record.textContent = `${formatNumber(stats.wins)}W / ${formatNumber(stats.losses)}L`;
      button.append(avatar, copy, record);
      button.addEventListener("click", () => {
        setStatsMode("quickplay");
        renderProfile(player);
        loadProfile(player.id);
        setSearchPopoverOpen(false);
      });
      return button;
    }));
  }

  async function searchPlayers(query) {
    const term = query.trim();
    const run = ++searchRun;
    setSearchPopoverOpen(true);
    $("playerSearchResults")?.replaceChildren();
    if (term.length < 2) return setSearchStatus("Enter at least 2 characters.");
    if (!fetcher) return setSearchStatus("Player search is unavailable.");
    $("btnPlayerSearch").disabled = true;
    setSearchStatus("Searching duelists...");
    try {
      const response = await fetcher(`/players/search?q=${encodeURIComponent(term)}`);
      const data = await response.json().catch(() => ({}));
      if (run !== searchRun) return;
      if (!response.ok) throw new Error(data.error || "Could not search players.");
      const players = data.players || [];
      renderSearchResults(players);
      setSearchStatus(players.length ? `${players.length} duelist${players.length === 1 ? "" : "s"} found.` : "No duelists found.");
    } catch (error) {
      if (run === searchRun) setSearchStatus(error.message || "Could not search players.");
    } finally {
      if (run === searchRun) $("btnPlayerSearch").disabled = false;
    }
  }

  function openProfile() {
    const user = getCurrentUser();
    if (!user) return notify?.("Login with Discord to view your profile.");
    activeTab = "achievements";
    markProgressSeen(user);
    setStatsMode("quickplay");
    renderProfile(user);
    changeScreen?.("profile");
    loadProfile(user.id);
  }

  function closeProfile() {
    changeScreen?.("menu");
  }

  function init(options = {}) {
    fetcher = options.fetcher;
    getAccountState = options.getAccountState;
    notify = options.showToast;
    changeScreen = options.switchScreen;
    if (eventsBound) return;
    eventsBound = true;
    $("accountProfile")?.addEventListener("click", () => openProfile());
    $("btnProfileBack")?.addEventListener("click", closeProfile);
    $("btnViewOwnProfile")?.addEventListener("click", openProfile);
    $("playerSearchInput")?.addEventListener("focus", () => setSearchPopoverOpen(true));
    $("playerSearchForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      searchPlayers($("playerSearchInput")?.value || "");
    });
    document.querySelectorAll("[data-stat-mode]").forEach((button) => {
      button.addEventListener("click", () => setStatsMode(button.dataset.statMode));
    });
    document.querySelectorAll("[data-profile-tab]").forEach((button) => {
      button.addEventListener("click", () => setActiveTab(button.dataset.profileTab));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("screen-profile")?.classList.contains("hidden")) closeProfile();
    });
  }

  window.ArcaneAccountProfile = { init, syncUser, open: openProfile, close: closeProfile };
})();
