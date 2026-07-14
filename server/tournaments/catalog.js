// Add a tournament here to publish it in the multiplayer lobby. Times use ISO
// 8601 UTC so the same event opens at the same instant for every player.
module.exports = [
  {
    id: "arcana-open-01",
    name: "Arcana Open #1",
    description: "Single-elimination tournament. Bring one legal deck and fight for the podium. Podium winners also receive 2 Grimdark Packs and 1 Eco Pack in Warera.",
    registrationOpensAt: "2026-07-14T00:00:00.000Z",
    registrationClosesAt: "2026-07-18T17:00:00.000Z",
    startsAt: "2026-07-18T18:00:00.000Z",
    timeZone: "Europe/Madrid",
    maxPlayers: 32,
    prizes: { first: 500, second: 250, third: 100 },
    enabled: true,
  },
];
