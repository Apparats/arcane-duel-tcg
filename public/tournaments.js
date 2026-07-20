// Tournament lobby UI. The server remains the source of truth for entry,
// bracket progression, and rewards; this module only renders that state.
(() => {
  let tournaments = [];
  let loading = false;
  let countdownTimer = null;
  let refreshTimer = null;
  let visible = false;
  let openBracketTournamentId = null;
  let lastBracketTrigger = null;
  let selectedRoundTab = null;
  let selectedRoundTabIsManual = false;
  const queuedMatches = new Map();

  const el = (id) => document.getElementById(id);
  const text = (value) => escapeHtml(String(value || ""));
  const dateTime = (value, timeZone) => new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: timeZone || "UTC",
  }).format(new Date(value));
  const localDateTime = (value) => new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
  const phaseLabel = (phase) => ({ upcoming: "Upcoming", registration: "Registration", locked: "Check-in closed", active: "In progress", completed: "Completed", cancelled: "Cancelled" }[phase] || phase);

  function clearCountdownTimer() {
    if (!countdownTimer) return;
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  function countdownText(startsAt) {
    const remainingMs = Date.parse(startsAt) - Date.now();
    if (!Number.isFinite(remainingMs) || remainingMs <= 0) return "Starting now";
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const days = Math.floor(remainingSeconds / 86400);
    const hours = Math.floor((remainingSeconds % 86400) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (days || hours) parts.push(`${hours}h`);
    if (days || hours || minutes) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return `Starts in ${parts.join(" ")}`;
  }

  function shortRemaining(deadline) {
    const remainingMs = Date.parse(deadline) - Date.now();
    if (!Number.isFinite(remainingMs) || remainingMs <= 0) return "0s";
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return minutes > 0 ? `${minutes}m ${String(seconds).padStart(2, "0")}s` : `${seconds}s`;
  }

  function syncCountdowns() {
    const countdowns = [...document.querySelectorAll("[data-tournament-countdown]")];
    const noShows = [...document.querySelectorAll("[data-tournament-noshow-deadline]")];
    let hasFutureStart = false;
    countdowns.forEach((countdown) => {
      const startsAt = countdown.dataset.tournamentCountdown;
      countdown.textContent = countdownText(startsAt);
      if (Date.parse(startsAt) > Date.now()) hasFutureStart = true;
    });
    let hasFutureNoShow = false;
    noShows.forEach((noShow) => {
      const deadline = noShow.dataset.tournamentNoshowDeadline;
      noShow.textContent = shortRemaining(deadline);
      if (Date.parse(deadline) > Date.now()) hasFutureNoShow = true;
    });
    if (!hasFutureStart && !hasFutureNoShow) clearCountdownTimer();
  }

  function startCountdowns() {
    clearCountdownTimer();
    syncCountdowns();
    if (document.querySelector("[data-tournament-countdown], [data-tournament-noshow-deadline]")) {
      countdownTimer = setInterval(syncCountdowns, 1000);
    }
  }

  function playerHTML(player, match) {
    if (!player) return '<span class="tournament-player">Waiting</span>';
    const isWinner = String(player.userId) === String(match.winnerId || "");
    const isEliminated = String(player.userId) === String(match.loserId || "");
    const state = isWinner ? " winner" : isEliminated ? " eliminated" : "";
    const marker = isWinner ? "Advanced" : isEliminated ? "Out" : "";
    return `<span class="tournament-player${state}"><span>${text(player.username)}</span>${marker ? `<small>${marker}</small>` : ""}</span>`;
  }

  function matchHTML(match, extraClass = "") {
    if (!match) return "";
    const noShowCountdown = match.status === "ready" && match.noShowDeadline
      ? ` - No contest in <span data-tournament-noshow-deadline="${text(match.noShowDeadline)}">${text(shortRemaining(match.noShowDeadline))}</span>`
      : "";
    const status = ({ ready: `Ready to play${noShowCountdown}`, waiting: "Awaiting result", complete: "Result", bye: "Advanced by bye", void: "No contest" })[match.status] || "";
    return `<div class="tournament-match ${text(match.status)} ${extraClass}"><div class="tournament-match-players">${match.players.map((player) => playerHTML(player, match)).join("")}</div>${status ? `<span class="tournament-match-status">${status}</span>` : ""}</div>`;
  }

  function determineDefaultRoundTab(tournament) {
    const bracket = tournament.bracket;
    if (!bracket) return "round-0";
    const currentUserId = window.ArcaneClient?.getAccountState()?.user?.id;
    const isInProgress = (match) => ["ready", "waiting"].includes(match?.status);

    // Prioritize the live round, instead of a completed match from an earlier
    // round that happens to contain this player.
    for (let index = 0; index < bracket.rounds.length; index += 1) {
      const currentRound = bracket.rounds[index];
      const myLiveMatch = currentRound.find((match) => isInProgress(match) && currentUserId && matchPlayerIds(match).includes(String(currentUserId)));
      if (myLiveMatch) return `round-${index}`;
    }
    for (let index = 0; index < bracket.rounds.length; index += 1) {
      const hasActive = bracket.rounds[index].some(isInProgress);
      if (hasActive) return `round-${index}`;
    }
    if (bracket.thirdPlace && isInProgress(bracket.thirdPlace)) {
      return "third-place";
    }
    if (tournament.phase === "completed") {
      if (bracket.placements && Object.values(bracket.placements).some(Boolean)) {
        return "podium";
      }
      return `round-${bracket.rounds.length - 1}`;
    }
    return "round-0";
  }

  // Older tournament payloads can omit playerIds even though they include the
  // populated player objects used by the UI. Support both shapes defensively.
  function matchPlayerIds(match) {
    if (Array.isArray(match?.playerIds)) return match.playerIds.filter(Boolean).map(String);
    return (match?.players || [])
      .map((player) => player?.userId ?? player?.id)
      .filter(Boolean)
      .map(String);
  }

  function renderMatchPlayerHTML(player, match, currentUserId) {
    if (!player) {
      return `
        <div class="bracket-match-player empty">
          <span class="player-name">Waiting...</span>
        </div>
      `;
    }
    const isMe = currentUserId && String(player.userId) === String(currentUserId);
    const isWinner = String(player.userId) === String(match.winnerId || "");
    const isEliminated = String(player.userId) === String(match.loserId || "");
    let playerClass = "";
    if (isMe) playerClass += " is-me";
    if (isWinner) playerClass += " winner";
    if (isEliminated) playerClass += " eliminated";

    let statusMarker = "";
    if (isWinner) {
      statusMarker = `<span class="player-marker winner-marker" title="Winner">🏆</span>`;
    } else if (isEliminated) {
      statusMarker = `<span class="player-marker eliminated-marker" title="Eliminated">Out</span>`;
    }

    return `
      <div class="bracket-match-player ${playerClass}">
        <div class="player-info">
          <span class="player-name">${text(player.username)}</span>
          ${isMe ? '<span class="player-me-pill">YOU</span>' : ""}
        </div>
        ${statusMarker}
      </div>
    `;
  }

  function renderMatchCardHTML(match, currentUserId, extraClass = "") {
    if (!match) return "";
    const isMyMatch = currentUserId && matchPlayerIds(match).includes(String(currentUserId));
    const statusClass = match.status; // ready, waiting, complete, bye, void
    const highlightClass = isMyMatch ? "my-match" : "";
    const playerA = match.players ? match.players[0] : null;
    const playerB = match.players ? match.players[1] : null;
    const playerAHTML = renderMatchPlayerHTML(playerA, match, currentUserId);
    const playerBHTML = renderMatchPlayerHTML(playerB, match, currentUserId);

    let statusText = "";
    let actionButton = "";

    if (match.status === "ready") {
      if (match.noShowDeadline) {
        statusText = `<span class="match-status-badge status-ready">Ready • Forfeit in <strong data-tournament-noshow-deadline="${text(match.noShowDeadline)}">${text(shortRemaining(match.noShowDeadline))}</strong></span>`;
      } else {
        statusText = `<span class="match-status-badge status-ready">Ready to play</span>`;
      }
      if (isMyMatch) {
        actionButton = `
          <button class="btn btn-primary btn-match-play" type="button" data-tournament-action="join" data-match-id="${text(match.id)}">
            Play Match
          </button>
        `;
      }
    } else if (match.status === "waiting") {
      statusText = `<span class="match-status-badge status-waiting">Awaiting result</span>`;
    } else if (match.status === "complete") {
      statusText = `<span class="match-status-badge status-complete">Completed</span>`;
    } else if (match.status === "bye") {
      statusText = `<span class="match-status-badge status-bye">Bye</span>`;
    } else if (match.status === "void") {
      statusText = `<span class="match-status-badge status-void">No contest</span>`;
    }

    return `
      <div class="bracket-match-card ${statusClass} ${highlightClass} ${extraClass}">
        <div class="bracket-match-id">Match ${match.slot + 1}</div>
        <div class="bracket-match-players">
          ${playerAHTML}
          <div class="bracket-match-vs">VS</div>
          ${playerBHTML}
        </div>
        <div class="bracket-match-footer">
          ${statusText}
          ${actionButton}
        </div>
      </div>
    `;
  }

  function renderPodiumHTML(bracket) {
    const placements = bracket.placements || {};
    const firstUser = placements.first ? text(placements.first.username) : "TBD";
    const secondUser = placements.second ? text(placements.second.username) : "TBD";
    const thirdUser = placements.third ? text(placements.third.username) : "TBD";

    return `
      <div class="bracket-podium-container">
        <h3 class="podium-heading">Tournament Champions</h3>
        <div class="bracket-podium-stages">
          <!-- Second Place -->
          <div class="podium-pillar pillar-second ${placements.second ? "filled" : ""}">
            <div class="podium-trophy">🥈</div>
            <div class="podium-user">${secondUser}</div>
            <div class="podium-block">
              <span class="podium-rank">2nd</span>
              <span class="podium-label">Runner-Up</span>
            </div>
          </div>
          <!-- First Place -->
          <div class="podium-pillar pillar-first ${placements.first ? "filled" : ""}">
            <div class="podium-crown">👑</div>
            <div class="podium-trophy">🏆</div>
            <div class="podium-user">${firstUser}</div>
            <div class="podium-block">
              <span class="podium-rank">1st</span>
              <span class="podium-label">Champion</span>
            </div>
          </div>
          <!-- Third Place -->
          <div class="podium-pillar pillar-third ${placements.third ? "filled" : ""}">
            <div class="podium-trophy">🥉</div>
            <div class="podium-user">${thirdUser}</div>
            <div class="podium-block">
              <span class="podium-rank">3rd</span>
              <span class="podium-label">Third Place</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bracketHTML(tournament) {
    const bracket = tournament.bracket;
    if (!bracket) return "";
    const currentUserId = window.ArcaneClient?.getAccountState()?.user?.id;

    // Generate tabs
    const tabs = [];
    bracket.rounds.forEach((round, index) => {
      let label = `Round ${index + 1}`;
      if (index === bracket.rounds.length - 1) {
        label = "Final";
      } else if (index === bracket.rounds.length - 2 && bracket.rounds.length > 1) {
        label = "Semifinals";
      }
      tabs.push({ id: `round-${index}`, label });
    });

    if (bracket.thirdPlace) {
      tabs.push({ id: "third-place", label: "3rd Place" });
    }

    if (bracket.placements && Object.values(bracket.placements).some(Boolean)) {
      tabs.push({ id: "podium", label: "Podium 🏆" });
    }

    // Rendering can run while the bracket is refreshing or after its selected
    // tab disappeared (for example, when a tournament advances). Never let a
    // stale/null selection prevent the card from opening.
    const availableTabIds = new Set(tabs.map((tab) => tab.id));
    if (!availableTabIds.has(selectedRoundTab)) {
      selectedRoundTab = tabs[0]?.id || "round-0";
    }

    const tabsHTML = `
      <div class="tournament-bracket-tabs" role="tablist">
        ${tabs.map(tab => {
          const isActive = selectedRoundTab === tab.id;
          return `
            <button class="tournament-tab-btn ${isActive ? "active" : ""}" 
                    type="button" 
                    role="tab" 
                    aria-selected="${isActive}" 
                    data-bracket-tab="${tab.id}">
              ${tab.label}
            </button>
          `;
        }).join("")}
      </div>
    `;
    const selectHTML = `
      <label class="tournament-bracket-select">
        <span>View round</span>
        <select data-bracket-tab-select aria-label="Select tournament round">
          ${tabs.map((tab) => `<option value="${tab.id}"${selectedRoundTab === tab.id ? " selected" : ""}>${tab.label}</option>`).join("")}
        </select>
      </label>
    `;

    let contentHTML = "";
    if (selectedRoundTab === "podium") {
      contentHTML = renderPodiumHTML(bracket);
    } else if (selectedRoundTab === "third-place") {
      contentHTML = `
        <div class="tournament-matches-grid single-match">
          ${renderMatchCardHTML(bracket.thirdPlace, currentUserId, "third-place")}
        </div>
      `;
    } else {
      const roundIndex = parseInt(String(selectedRoundTab).replace("round-", ""), 10);
      const roundMatches = bracket.rounds[roundIndex] || [];
      contentHTML = `
        <div class="tournament-matches-grid${roundMatches.length === 1 ? " single-match" : ""}">
          ${roundMatches.map(match => renderMatchCardHTML(match, currentUserId)).join("")}
        </div>
      `;
    }

    const subtitle = tournament.phase === "completed" ? "Completed Tournament" : "Live Tournament Bracket";
    const bracketPlayerCount = Number(bracket.playerCount);
    const tournamentPlayerCount = Number(tournament.participantCount);
    const inferredPlayerCount = new Set(bracket.rounds.flat().flatMap(matchPlayerIds)).size;
    const participantCount = Number.isFinite(bracketPlayerCount)
      ? bracketPlayerCount
      : Number.isFinite(tournamentPlayerCount)
        ? tournamentPlayerCount
        : inferredPlayerCount;

    return `
      <div class="tournament-bracket-layout">
        <div class="tournament-bracket-meta-header">
          <span class="tournament-bracket-subtitle">${subtitle}</span>
          <span class="tournament-bracket-players-count">${participantCount} participants</span>
        </div>
        ${tabsHTML}
        ${selectHTML}
        <div class="tournament-bracket-tab-content">
          ${contentHTML}
        </div>
      </div>
    `;
  }

  function findMatch(tournament, matchId) {
    if (!matchId || !tournament.bracket) return null;
    const matches = [...tournament.bracket.rounds.flat(), tournament.bracket.thirdPlace].filter(Boolean);
    return matches.find((match) => match.id === matchId) || null;
  }

  function myTournamentHTML(tournament) {
    if (tournament.phase !== "active" || !tournament.registered) return "";
    const myMatch = findMatch(tournament, tournament.myMatchId);
    const status = tournament.myStatus?.message
      ? `<p class="tournament-my-status status-${text(tournament.myStatus.kind)}">${text(tournament.myStatus.message)}</p>`
      : '<p class="tournament-my-status">Waiting for the bracket to update.</p>';
    return `<section class="tournament-my-match" aria-label="Your tournament status">
      <div class="tournament-my-match-heading"><span>Your tournament</span><small>${myMatch ? "Current match" : "Status"}</small></div>
      ${myMatch ? matchHTML(myMatch, "tournament-match-current") : ""}
      ${status}
    </section>`;
  }

  function actionHTML(tournament) {
    if (tournament.phase === "registration") {
      return tournament.registered
        ? '<div class="tournament-actions"><span class="tournament-registered">Registered</span><button class="btn btn-secondary" type="button" data-tournament-action="unregister">Leave</button></div>'
        : '<div class="tournament-actions"><button class="btn btn-primary" type="button" data-tournament-action="register">Pre-register</button></div>';
    }
    if (tournament.phase === "active" && tournament.myMatchId) {
      const queueKey = `${tournament.id}:${tournament.myMatchId}`;
      const queued = queuedMatches.get(queueKey);
      if (queued?.state === "preparing") {
        const position = queued.position > 1 ? ` Queue position: ${queued.position}.` : "";
        return `<div class="tournament-actions"><span class="tournament-player-state status-waiting-round">Both players are ready. Preparing your match.${text(position)}</span></div>`;
      }
      if (queued) {
        const deadline = queued.noShowDeadline ? ` Forfeit in <span data-tournament-noshow-deadline="${text(queued.noShowDeadline)}">${text(shortRemaining(queued.noShowDeadline))}</span>.` : "";
        return `<div class="tournament-actions"><span class="tournament-player-state status-waiting-round">Waiting for your opponent to enter this match.${deadline}</span><button class="btn btn-secondary" type="button" data-tournament-action="cancel-match">Cancel</button></div>`;
      }
      return `<div class="tournament-actions"><button class="btn btn-primary" type="button" data-tournament-action="join" data-match-id="${text(tournament.myMatchId)}">Play match</button></div>`;
    }
    return "";
  }

  function tournamentHTML(tournament) {
    const prize = tournament.prizes || {};
    const startInFuture = Date.parse(tournament.startsAt) > Date.now();
    const registrationTime = tournament.phase === "upcoming" ? `Registration opens ${dateTime(tournament.registrationOpensAt, tournament.timeZone)}`
      : tournament.phase === "registration" ? `Registration closes ${dateTime(tournament.registrationClosesAt, tournament.timeZone)}`
        : null;
    const bracketButton = tournament.bracket
      ? `<button class="tournament-bracket-open" type="button" data-tournament-action="open-bracket" aria-label="View ${text(tournament.name)} bracket" title="View bracket">?</button>`
      : "";
    return `<article class="tournament-card" data-tournament-id="${text(tournament.id)}">
      <header class="tournament-card-header"><h2>${text(tournament.name)}</h2><div class="tournament-card-header-actions"><span class="tournament-phase phase-${text(tournament.phase)}">${text(phaseLabel(tournament.phase))}</span>${bracketButton}</div></header>
      <div class="tournament-card-body">
        <p class="tournament-description">${text(tournament.description)}</p>
        ${registrationTime ? `<p class="tournament-timing">${text(registrationTime)}</p>` : ""}
        <p class="tournament-timing">${tournament.phase === "active" || tournament.phase === "completed" ? "Started" : "Starts"} ${text(dateTime(tournament.startsAt, tournament.timeZone))}</p>
        <p class="tournament-timing tournament-local-start">Your local start: ${text(localDateTime(tournament.startsAt))}</p>
        ${tournament.finishedAt ? `<p class="tournament-timing">Completed ${text(localDateTime(tournament.finishedAt))}</p>` : ""}
        ${startInFuture ? `<p class="tournament-countdown" data-tournament-countdown="${text(tournament.startsAt)}">Starts in --</p>` : ""}
        <div class="tournament-meta"><span>${tournament.participantCount}/${tournament.maxPlayers} players</span><span><strong>1st</strong> ${prize.first || 0} gold</span><span><strong>2nd</strong> ${prize.second || 0} gold</span><span><strong>3rd</strong> ${prize.third || 0} gold</span></div>
        ${myTournamentHTML(tournament)}
        ${actionHTML(tournament)}
      </div>
    </article>`;
  }

  function render() {
    const list = el("tournamentList");
    if (!list) return;
    clearCountdownTimer();
    if (loading && tournaments.length === 0) {
      list.innerHTML = '<p class="tournament-empty">Loading tournaments...</p>';
      return;
    }
    const current = tournaments.filter((tournament) => !["completed", "cancelled"].includes(tournament.phase));
    const history = tournaments.filter((tournament) => ["completed", "cancelled"].includes(tournament.phase));
    list.innerHTML = tournaments.length
      ? `${current.map(tournamentHTML).join("")}${history.length ? `<section class="tournament-history"><div class="tournament-history-heading"><span>Tournament history</span><small>Completed brackets remain available here.</small></div>${history.map(tournamentHTML).join("")}</section>` : ""}`
      : '<p class="tournament-empty">No tournaments are scheduled right now.</p>';
    syncBracketModal();
    startCountdowns();
  }

  function syncBracketModal() {
    if (!openBracketTournamentId) return;
    const tournament = tournaments.find((entry) => entry.id === openBracketTournamentId);
    if (!tournament?.bracket) return closeBracketModal({ restoreFocus: false });
    const modal = el("tournamentBracketModal");
    if (!modal) return;

    // Always ensure selectedRoundTab is initialised before using it
    const bracket = tournament.bracket;
    if (!selectedRoundTab || (tournament.phase === "active" && !selectedRoundTabIsManual)) {
      selectedRoundTab = determineDefaultRoundTab(tournament);
    }

    // Clamp selectedRoundTab if the bracket has changed since it was chosen
    if (selectedRoundTab === "podium" && (!bracket.placements || !Object.values(bracket.placements).some(Boolean))) {
      selectedRoundTab = `round-${bracket.rounds.length - 1}`;
    }
    if (selectedRoundTab === "third-place" && !bracket.thirdPlace) {
      selectedRoundTab = `round-${bracket.rounds.length - 1}`;
    }
    const roundMatch = typeof selectedRoundTab === "string" ? selectedRoundTab.match(/^round-(\d+)$/) : null;
    if (roundMatch) {
      const idx = parseInt(roundMatch[1], 10);
      if (idx >= bracket.rounds.length) {
        selectedRoundTab = `round-${bracket.rounds.length - 1}`;
      }
    }

    el("tournamentBracketModalTitle").textContent = `${tournament.name} bracket`;
    el("tournamentBracketModalContent").innerHTML = bracketHTML(tournament);
  }

  function openBracketModal(tournament, trigger) {
    if (!tournament?.bracket) return;
    openBracketTournamentId = tournament.id;
    selectedRoundTab = determineDefaultRoundTab(tournament);
    selectedRoundTabIsManual = false;
    lastBracketTrigger = trigger || document.activeElement;
    const modal = el("tournamentBracketModal");
    if (!modal) return;
    modal.classList.remove("hidden");
    syncBracketModal();
    setTimeout(() => el("btnCloseTournamentBracket")?.focus(), 0);
  }

  function closeBracketModal({ restoreFocus = true } = {}) {
    const modal = el("tournamentBracketModal");
    if (modal) modal.classList.add("hidden");
    openBracketTournamentId = null;
    selectedRoundTab = null;
    selectedRoundTabIsManual = false;
    if (restoreFocus) lastBracketTrigger?.focus?.();
    lastBracketTrigger = null;
  }

  function syncRefreshTimer() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
    if (!visible || document.hidden) return;
    const openTournament = tournaments.find((entry) => entry.id === openBracketTournamentId);
    if (openTournament && ["completed", "cancelled"].includes(openTournament.phase)) return;
    refreshTimer = setInterval(() => void load(), 5_000);
  }

  async function load() {
    if (loading) return;
    loading = true;
    render();
    try {
      const response = await arcaneFetch("/tournaments");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load tournaments.");
      tournaments = Array.isArray(data.tournaments) ? data.tournaments : [];
    } catch (error) {
      showToast(error.message || "Could not load tournaments.");
    } finally {
      loading = false;
      render();
      syncRefreshTimer();
    }
  }

  async function registration(tournamentId, method) {
    const response = await arcaneFetch(`/tournaments/${encodeURIComponent(tournamentId)}/register`, { method });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not update tournament registration.");
    await load();
  }



  el("tournamentList")?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-tournament-action]");
    if (!button) return;
    const card = button.closest("[data-tournament-id]");
    const tournamentId = card?.dataset.tournamentId;
    if (!tournamentId) return;
    try {
      if (button.dataset.tournamentAction === "open-bracket") {
        const tournament = tournaments.find((entry) => entry.id === tournamentId);
        return openBracketModal(tournament, button);
      }
      if (button.dataset.tournamentAction === "register") await registration(tournamentId, "POST");
      if (button.dataset.tournamentAction === "unregister") await registration(tournamentId, "DELETE");
      if (button.dataset.tournamentAction === "join") {
        connect(() => send("tournamentJoinMatch", { tournamentId, matchId: button.dataset.matchId }));
      }
      if (button.dataset.tournamentAction === "cancel-match") {
        send("cancelTournamentMatch", {});
        const tournament = tournaments.find((entry) => entry.id === tournamentId);
        queuedMatches.delete(`${tournamentId}:${tournament?.myMatchId || ""}`);
        render();
      }
    } catch (error) {
      showToast(error.message || "Could not update tournament registration.");
    }
  });

  el("tournamentBracketModal")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) {
      closeBracketModal();
      return;
    }
    const tabBtn = event.target.closest("[data-bracket-tab]");
    if (tabBtn) {
      selectedRoundTab = tabBtn.dataset.bracketTab;
      selectedRoundTabIsManual = true;
      syncBracketModal();
      return;
    }
    const button = event.target.closest("[data-tournament-action]");
    if (button) {
      const tournamentId = openBracketTournamentId;
      if (!tournamentId) return;
      if (button.dataset.tournamentAction === "join") {
        connect(() => send("tournamentJoinMatch", { tournamentId, matchId: button.dataset.matchId }));
        closeBracketModal();
      }
    }
  });
  el("tournamentBracketModal")?.addEventListener("change", (event) => {
    const select = event.target.closest("[data-bracket-tab-select]");
    if (!select) return;
    selectedRoundTab = select.value;
    selectedRoundTabIsManual = true;
    syncBracketModal();
  });
  el("btnCloseTournamentBracket")?.addEventListener("click", () => closeBracketModal());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el("tournamentBracketModal")?.classList.contains("hidden")) closeBracketModal();
  });

  window.ArcaneTournaments = {
    load,
    setVisible(nextVisible) {
      visible = Boolean(nextVisible);
      syncRefreshTimer();
      if (visible) void load();
    },
    setQueuedMatch(payload) {
      if (!payload?.tournamentId || !payload?.matchId) return;
      queuedMatches.set(`${payload.tournamentId}:${payload.matchId}`, { state: "waiting", noShowDeadline: payload.noShowDeadline || null });
      render();
    },
    setPreparingMatch(payload) {
      if (!payload?.tournamentId || !payload?.matchId) return;
      queuedMatches.set(`${payload.tournamentId}:${payload.matchId}`, { state: "preparing", position: Number(payload.queuePosition) || 1 });
      render();
    },
    clearQueuedMatch(payload) {
      if (payload?.tournamentId && payload?.matchId) queuedMatches.delete(`${payload.tournamentId}:${payload.matchId}`);
      else queuedMatches.clear();
      render();
    },
  };

  document.addEventListener("visibilitychange", syncRefreshTimer);
})();
