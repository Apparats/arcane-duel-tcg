const { rankQuickplayPlayers } = require("../server/db");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function user(id, { quickplayWins = 0, rankedWins = 0, rankedLosses = 0, rating = 0, legacyWins = 0 } = {}) {
  return {
    _id: id,
    username: `Player ${id}`,
    stats: { quickplayWins, wins: legacyWins },
    modeStats: {
      quickplay: { wins: quickplayWins },
      ranked: { wins: rankedWins, losses: rankedLosses },
    },
    ranked: { rating },
  };
}

function main() {
  const users = [
    user("a", { quickplayWins: 12, rating: 2200 }),
    user("b", { quickplayWins: 9, rankedWins: 4, rankedLosses: 1, rating: 900 }),
    user("c", { quickplayWins: 5, rankedWins: 1, rating: 1500 }),
    user("d", {}),
    user("e", { rankedLosses: 1, rating: 2300 }),
    user("f", { legacyWins: 2 }),
  ];
  const ranking = rankQuickplayPlayers(users, "c", 2);
  assert(ranking.players.length === 2, "Ranking should return only the requested top entries.");
  assert(ranking.players[0].username === "Player b", "Ranking must include ranked wins in the victories view.");
  assert(ranking.currentPlayer?.rank === 3, "Player outside the top should include their absolute rank.");
  assert(ranking.players[0].ranked?.rank?.id === "gold", "Ranking rows should expose the player's current ranked tier.");
  assert(!ranking.players.some((player) => player.username === "Player d"), "Players with no victories should not be ranked.");
  assert(rankQuickplayPlayers(users, "f", 10).players.some((player) => player.username === "Player f"), "Legacy wins should still be eligible for the victories view.");

  const ranked = rankQuickplayPlayers(users, "b", 2, "ranked");
  assert(ranked.players[0].username === "Player e", "Ranked view must order by rating descending.");
  assert(!ranked.players.some((player) => player.username === "Player a"), "Ranked view should require at least one ranked match.");
  assert(ranked.currentPlayer?.rank === 3, "Ranked current player outside the top should include their absolute rank.");
  console.log("--- QUICKPLAY RANKING TEST OK ---");
}

main();
