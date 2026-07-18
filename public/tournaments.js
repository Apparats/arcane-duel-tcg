// Tournament lobby UI. The server remains the source of truth for entry,
// bracket progression, and rewards; this module only renders that state.
(() => {
  let tournaments = [];
  let loading = false;
  let countdownTimer = null;
  let refreshTimer = null;
  let visible = false;
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

  function syncCountdowns() {
    const countdowns = [...document.querySelectorAll("[data-tournament-countdown]")];
    let hasFutureStart = false;
    countdowns.forEach((countdown) => {
      const startsAt = countdown.dataset.tournamentCountdown;
      countdown.textContent = countdownText(startsAt);
      if (Date.parse(startsAt) > Date.now()) hasFutureStart = true;
    });
    if (!hasFutureStart) clearCountdownTimer();
  }

  function startCountdowns() {
    clearCountdownTimer();
    syncCountdowns();
    if (document.querySelector("[data-tournament-countdown]")) {
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
    const status = ({ ready: "Ready to play", waiting: "Awaiting result", complete: "Result", bye: "Advanced by bye", void: "No contest" })[match.status] || "";
    return `<div class="tournament-match ${text(match.status)} ${extraClass}"><div class="tournament-match-players">${match.players.map((player) => playerHTML(player, match)).join("")}</div>${status ? `<span class="tournament-match-status">${status}</span>` : ""}</div>`;
  }

  function bracketHTML(tournament) {
    if (!tournament.bracket) return "";
    const rounds = tournament.bracket.rounds.map((round, index) => `
      <section class="tournament-round">
        <span class="tournament-round-label">${index === tournament.bracket.rounds.length - 1 ? "Final" : `Round ${index + 1}`}</span>
        ${round.map((match) => matchHTML(match)).join("")}
      </section>
    `).join("");
    const third = tournament.bracket.thirdPlace ? `<section class="tournament-round"><span class="tournament-round-label">Third place</span>${matchHTML(tournament.bracket.thirdPlace, "tournament-match-third")}</section>` : "";
    const podium = [
      ["first", "Champion"],
      ["second", "Runner-up"],
      ["third", "Third place"],
    ].filter(([place]) => tournament.bracket.placements?.[place]).map(([place, label]) => `<div class="tournament-podium-place podium-${place}"><span>${label}</span><strong>${text(tournament.bracket.placements[place].username)}</strong></div>`).join("");
    const title = tournament.phase === "completed" ? "Final bracket" : "Live bracket";
    return `<div class="tournament-bracket"><span class="tournament-bracket-title">${title}</span><div class="tournament-rounds">${rounds}${third}</div>${podium ? `<div class="tournament-podium">${podium}</div>` : ""}</div>`;
  }

  function actionHTML(tournament) {
    const status = tournament.myStatus?.message
      ? `<span class="tournament-player-state status-${text(tournament.myStatus.kind)}">${text(tournament.myStatus.message)}</span>`
      : "";
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
        return '<div class="tournament-actions"><span class="tournament-player-state status-waiting-round">Waiting for your opponent to enter this match.</span><button class="btn btn-secondary" type="button" data-tournament-action="cancel-match">Cancel</button></div>';
      }
      return `<div class="tournament-actions">${status}<button class="btn btn-primary" type="button" data-tournament-action="join" data-match-id="${text(tournament.myMatchId)}">Play match</button></div>`;
    }
    if (tournament.phase === "active" && tournament.registered) return `<div class="tournament-actions">${status || '<span class="tournament-player-state">Waiting for the bracket to update.</span>'}</div>`;
    return "";
  }

  function tournamentHTML(tournament) {
    const prize = tournament.prizes || {};
    const startInFuture = Date.parse(tournament.startsAt) > Date.now();
    const registrationTime = tournament.phase === "upcoming" ? `Registration opens ${dateTime(tournament.registrationOpensAt, tournament.timeZone)}`
      : tournament.phase === "registration" ? `Registration closes ${dateTime(tournament.registrationClosesAt, tournament.timeZone)}`
        : null;
    return `<article class="tournament-card" data-tournament-id="${text(tournament.id)}">
      <header class="tournament-card-header"><h2>${text(tournament.name)}</h2><span class="tournament-phase phase-${text(tournament.phase)}">${text(phaseLabel(tournament.phase))}</span></header>
      <div class="tournament-card-body">
        <p class="tournament-description">${text(tournament.description)}</p>
        ${registrationTime ? `<p class="tournament-timing">${text(registrationTime)}</p>` : ""}
        <p class="tournament-timing">${tournament.phase === "active" || tournament.phase === "completed" ? "Started" : "Starts"} ${text(dateTime(tournament.startsAt, tournament.timeZone))}</p>
        <p class="tournament-timing tournament-local-start">Your local start: ${text(localDateTime(tournament.startsAt))}</p>
        ${tournament.finishedAt ? `<p class="tournament-timing">Completed ${text(localDateTime(tournament.finishedAt))}</p>` : ""}
        ${startInFuture ? `<p class="tournament-countdown" data-tournament-countdown="${text(tournament.startsAt)}">Starts in --</p>` : ""}
        <div class="tournament-meta"><span>${tournament.participantCount}/${tournament.maxPlayers} players</span><span><strong>1st</strong> ${prize.first || 0} gold</span><span><strong>2nd</strong> ${prize.second || 0} gold</span><span><strong>3rd</strong> ${prize.third || 0} gold</span></div>
        ${actionHTML(tournament)}
        ${bracketHTML(tournament)}
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
    startCountdowns();
  }

  function syncRefreshTimer() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
    if (!visible || document.hidden) return;
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

  window.ArcaneTournaments = {
    load,
    setVisible(nextVisible) {
      visible = Boolean(nextVisible);
      syncRefreshTimer();
      if (visible) void load();
    },
    setQueuedMatch(payload) {
      if (!payload?.tournamentId || !payload?.matchId) return;
      queuedMatches.set(`${payload.tournamentId}:${payload.matchId}`, { state: "waiting" });
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
