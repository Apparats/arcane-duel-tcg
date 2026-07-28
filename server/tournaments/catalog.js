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
    prizes: { first: 1000, second: 500, third: 250 },
    enabled: true,
  },
  {
    id: "arcana-open-02",
    name: "Arcana Open #2",
    description: "Single-elimination tournament. Bring one legal deck and fight for the podium. Rewards include gold prizes, the creation of a legendary or mythic card based on the finalist, and a Warera skin pack.",
    registrationOpensAt: "2026-07-27T00:00:00.000Z",
    registrationClosesAt: "2026-08-01T18:00:00.000Z",
    startsAt: "2026-08-01T19:00:00.000Z",
    timeZone: "Europe/Madrid",
    maxPlayers: 32,
    prizes: { first: 1200, second: 600, third: 300 },
    enabled: true,
  },
];
