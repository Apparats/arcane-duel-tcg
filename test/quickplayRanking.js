const { rankQuickplayPlayers } = require("../server/db");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function user(id, wins) {
  return { _id: id, username: `Player ${id}`, stats: { quickplayWins: wins } };
}

function main() {
  const users = [user("a", 12), user("b", 9), user("c", 5), user("d", 0)];
  const ranking = rankQuickplayPlayers(users, "c", 2);
  assert(ranking.players.length === 2, "Ranking should return only the requested top entries.");
  assert(ranking.players[0].username === "Player a", "Ranking must order wins descending.");
  assert(ranking.currentPlayer?.rank === 3, "Player outside the top should include their absolute rank.");
  assert(!ranking.players.some((player) => player.username === "Player d"), "Players with no quickplay wins should not be ranked.");
  console.log("--- QUICKPLAY RANKING TEST OK ---");
}

main();
