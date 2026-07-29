const { Game } = require("../public/engine");
const { DECK_SIZE, buildFallbackDeck, validateDeck } = require("../public/deckRules");
const { createCampaignMatch, normalizeCampaignEncounter } = require("../server/campaigns");
const { discardActiveSingleplayerMatch } = require("../server/singleplayerMatchService");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testMinion(instanceId, cardId = "base:aleex", keywords = []) {
  return {
    instanceId,
    cardId,
    name: cardId,
    attack: 1,
    health: 1,
    maxHealth: 1,
    keywords,
    canAttack: false,
    divineShield: false,
    statuses: [],
  };
}

function firstPlayableMinion(state) {
  return state.me.hand.findIndex((card) => card.type === "minion" && card.cost <= state.me.manaCurrent);
}

function main() {
  const game = new Game("TEST", "Bot1", "Bot2");
  let state0 = game.getStateFor(0);

  assert(state0.turn === 0, "Player 0 should start.");
  assert(state0.me.hand.length === 4, "Player 0 should start with 4 cards after the first draw.");
  assert(state0.opponent.handCount === 4, "Player 1 should start with 4 cards.");
  assert(state0.me.deckCount === DECK_SIZE - 4, `Deck should have ${DECK_SIZE} cards before opening draws.`);

  const secondPlayerStarts = new Game("SECOND_STARTS", "First", "Second", { startingPlayerIdx: 1 });
  let secondStarterState = secondPlayerStarts.getStateFor(1);
  assert(secondStarterState.turn === 1, "The configured second player should start.");
  assert(secondStarterState.me.hand.length === 4, "The starter should receive four opening cards.");
  assert(secondStarterState.opponent.handCount === 4, "The non-starter should receive the compensating opening card.");
  secondPlayerStarts.endTurn(1);
  assert(secondPlayerStarts.getStateFor(0).turnNumber === 1, "The shared round should remain on round 1 after the starter ends.");
  secondPlayerStarts.endTurn(0);
  assert(secondPlayerStarts.getStateFor(1).turnNumber === 2, "The shared round should advance when control returns to the starter.");

  const manaSparkGame = new Game("MANA_SPARK", "First", "Second", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    startingPlayerIdx: 0,
    grantSecondPlayerManaCard: true,
  });
  assert(manaSparkGame.players[1].hand.includes("special:manaspark"), "The player going second should receive Mana Spark.");
  manaSparkGame.endTurn(0);
  const manaSparkIndex = manaSparkGame.players[1].hand.indexOf("special:manaspark");
  const manaBeforeSpark = manaSparkGame.players[1].manaCurrent;
  manaSparkGame.playCard(1, manaSparkIndex, null);
  assert(manaSparkGame.players[1].manaCurrent === manaBeforeSpark + 1, "Mana Spark must grant 1 temporary Mana.");
  assert(!manaSparkGame.players[1].hand.includes("special:manaspark"), "Mana Spark must be consumed when played.");
  manaSparkGame.endTurn(1);
  manaSparkGame.endTurn(0);
  assert(manaSparkGame.players[1].manaCurrent === manaSparkGame.players[1].manaMax, "Mana Spark's Mana must expire at the next turn.");

  const mulliganGame = new Game("MULLIGAN", "First", "Second", {
    decks: [
      [
        "base:aleex", "base:barto", "base:beitsas", "base:capybara", "base:disappointmentpanda",
        "base:eraserhead", "base:galileo-gunplay", "base:miyabi", "base:stormhazard", "base:archbishopmaximilian",
        "base:babu", "base:dog", "base:kep", "base:lifelinker", "base:juniiya",
        "base:jakal", "base:kysely", "base:humph", "base:kurzemnieks", "base:hazzard",
      ],
      Array(20).fill("base:aleex"),
    ],
    randomInt: () => 0,
    startingPlayerIdx: 0,
    grantSecondPlayerManaCard: true,
  });
  const firstOpeningCard = mulliganGame.players[0].hand[0];
  const firstDeckCount = mulliganGame.players[0].deck.length;
  const replaced = mulliganGame.replaceOpeningHandCards(0, [0]);
  assert(replaced === 1, "Mulligan should replace the selected opening card.");
  assert(mulliganGame.players[0].hand[0] !== firstOpeningCard, "Mulligan should draw a different card from the deck first.");
  assert(mulliganGame.players[0].deck.length === firstDeckCount, "Mulligan should keep total deck size stable after replacement.");
  const sparkIndex = mulliganGame.players[1].hand.indexOf("special:manaspark");
  assert(sparkIndex >= 0, "The second player should have Mana Spark during mulligan.");
  assertThrows(() => mulliganGame.replaceOpeningHandCards(1, [sparkIndex]), "Mana Spark should not be replaceable during mulligan.");

  const fallbackDeck = buildFallbackDeck();
  const fullCollection = fallbackDeck.reduce((collection, cardId) => {
    collection[cardId] = (collection[cardId] || 0) + 2;
    return collection;
  }, {});
  assert(validateDeck(fallbackDeck, { cardCollection: fullCollection }).ok, `Fallback ${DECK_SIZE}-card deck should be valid.`);

  const p0CardIdx = firstPlayableMinion(state0);
  if (p0CardIdx !== -1) {
    game.playCard(0, p0CardIdx, null);
    state0 = game.getStateFor(0);
    assert(state0.me.board.length === 1, "Player 0 should have played a minion.");
  }

  const zeroAttackGame = new Game("ZERO_ATTACK", "Zero", "Target", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
  const zeroAttacker = testMinion("zero-attacker");
  zeroAttacker.attack = 0;
  zeroAttacker.canAttack = true;
  zeroAttackGame.players[0].board = [zeroAttacker];
  assertThrows(
    () => zeroAttackGame.attack(0, zeroAttacker.instanceId, "face"),
    "A minion with 0 Attack should not be able to attack."
  );

  game.endTurn(0);
  let state1 = game.getStateFor(1);
  assert(state1.turn === 1, "Player 1 should have the turn after Player 0 ends.");
  assert(state1.turnNumber === 1, "Player 1 should still play in shared round 1.");

  const p1CardIdx = firstPlayableMinion(state1);
  if (p1CardIdx !== -1) {
    game.playCard(1, p1CardIdx, null);
    state1 = game.getStateFor(1);
    assert(state1.me.board.length === 1, "Player 1 should have played a minion.");
  }

  game.endTurn(1);
  state0 = game.getStateFor(0);
  assert(state0.turn === 0, "Player 0 should regain the turn after Player 1 ends.");
  assert(state0.turnNumber === 2, "The shared round should advance only after both players finish round 1.");

  game.surrender(1);
  state0 = game.getStateFor(0);
  assert(state0.winner === 0, "Player 0 should win when Player 1 surrenders.");

  const lolflameAttackTest = new Game("LOLFLAME_ATTACK", "Lolflame", "Target", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
  lolflameAttackTest.players[0].board = [{
    ...testMinion("lolflame", "base:lolflame2"),
    name: "Lolflame",
    attack: 3,
    health: 7,
    maxHealth: 7,
    canAttack: true,
  }];
  lolflameAttackTest.players[1].board = [{
    ...testMinion("enemy-minion", "base:aleex"),
    health: 2,
    maxHealth: 2,
  }];
  lolflameAttackTest.attack(0, "lolflame", "face");
  assert(lolflameAttackTest.players[1].health === 27, "Lolflame should still deal its normal damage to the enemy hero.");
  assert(lolflameAttackTest.players[1].board[0].health === 1, "Lolflame should damage every enemy minion after a face attack.");

  const exhaustedGame = new Game("EXHAUSTED", "Empty A", "Empty B");
  exhaustedGame.players.forEach((player) => {
    player.hand = [];
    player.deck = [];
    player.board = [];
  });
  exhaustedGame._checkWin();
  assert(exhaustedGame.winner === "draw", "A match should draw when both players have no hand, deck, or board.");

  const turnSummonTest = new Game("TURN-SUMMONS", "Summoner", "Opponent", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
  turnSummonTest.players[0].board = [testMinion("maker", "base:multimaker")];
  turnSummonTest.players[1].board = [testMinion("gabibbo", "base:gabibbo-ardito")];
  turnSummonTest.endTurn(0);
  assert(turnSummonTest.players[0].board.length === 1, "Multimaker should not summon during the opponent's turn.");
  assert(turnSummonTest.players[1].board.length === 2, "Gabibbo should clone at the start of its owner's turn.");
  turnSummonTest.endTurn(1);
  assert(turnSummonTest.players[0].board.length === 2, "Multimaker should summon one Multi at the start of its owner's turn.");
  assert(turnSummonTest.players[1].board.length === 2, "Gabibbo should not clone during the opponent's turn.");

  const boardTest = new Game("BOARD", "Board1", "Board2", {
    decks: [
      Array(20).fill("core:recluta-novato"),
      Array(20).fill("core:recluta-novato"),
    ],
  });
  boardTest.players[0].board = Array.from({ length: 4 }, (_, idx) => testMinion(`b${idx}`, "core:recluta-novato"));
  boardTest.players[0].hand = ["core:recluta-novato"];
  boardTest.players[0].manaCurrent = 10;
  assertThrows(() => boardTest.playCard(0, 0, null), "A full board should reject the fifth minion.");

  const campaignRulesTest = new Game("CAMPAIGN", "Player", "Campaign NPC", {
    decks: [Array(30).fill("base:aleex"), Array(30).fill("base:aleex")],
    playerConfigs: [
      {},
      {
        health: 55,
        maxHealth: 55,
        startingMana: 7,
        manaCap: 12,
        ignoreDeckSizeLimit: true,
        boardRules: { maxMinions: null, ignoreKeywordLimits: true },
      },
    ],
  });
  assert(campaignRulesTest.players[1].deck.length === 26, "Campaign NPC decks should keep every configured card.");
  assert(campaignRulesTest.players[0].deck.length === DECK_SIZE - 4, "Player decks should use the current deck size limit.");
  campaignRulesTest.endTurn(0);
  assert(campaignRulesTest.players[1].health === 55, "Campaign NPC health should use its configured value.");
  assert(campaignRulesTest.players[1].manaCurrent === 7, "Campaign NPC should receive its configured starting mana.");
  campaignRulesTest.players[1].board = Array.from({ length: 8 }, (_, idx) => testMinion(`campaign${idx}`));
  campaignRulesTest.players[1].hand = ["base:aleex"];
  campaignRulesTest.playCard(1, 0, null);
  assert(campaignRulesTest.players[1].board.length === 9, "Campaign board rules should allow unlimited NPC minions.");

  const uniqueMythicTest = new Game("UNIQUE_MYTHIC", "Player", "Protector", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
    playerConfigs: [{}, { uniqueMythicPlays: true }],
  });
  uniqueMythicTest.turn = 1;
  uniqueMythicTest.players[1].hand = ["base:lolflame2"];
  uniqueMythicTest.players[1].manaCurrent = 10;
  uniqueMythicTest.playCard(1, 0, null);
  uniqueMythicTest.players[1].hand = ["base:lolflame2"];
  uniqueMythicTest.players[1].manaCurrent = 10;
  assertThrows(() => uniqueMythicTest.playCard(1, 0, null), "Unique Mythic players should not replay the same Mythic card.");

  const campaignEncounter = normalizeCampaignEncounter({
    id: "test-gatekeeper",
    name: "Test Gate",
    lore: "A test encounter.",
    rewards: { cards: ["base:aleex"] },
    npc: {
      name: "Gatekeeper",
      avatarUrl: "art/reverse.webp",
      health: 45,
      mana: { starting: 4, cap: 12 },
      deck: Array(24).fill("base:aleex"),
      ignoreDeckSizeLimit: true,
      boardRules: { maxMinions: null, ignoreKeywordLimits: true },
    },
  });
  const campaignMatch = createCampaignMatch(campaignEncounter, {
    roomCode: "CAMP",
    playerName: "Player",
    playerDeck: Array(20).fill("base:aleex"),
  });
  assert(campaignMatch.npc.name === "Gatekeeper", "Campaign matches should expose the configured NPC identity.");
  assert(campaignMatch.npc.avatarUrl === "art/reverse.webp", "Campaign matches should expose the configured NPC avatar.");
  assert(campaignMatch.game.players[1].maxHealth === 45, "Campaign factory should configure NPC health.");

  const tauntTest = new Game("TAUNT", "Taunt1", "Taunt2", {
    decks: [
      Array(20).fill("base:barto"),
      Array(20).fill("base:aleex"),
    ],
  });
  tauntTest.players[0].board = [
    testMinion("t1", "base:barto", ["taunt"]),
    testMinion("t2", "base:babu", ["taunt"]),
  ];
  tauntTest.players[0].hand = ["base:alfred-longstocking"];
  tauntTest.players[0].manaCurrent = 10;
  assertThrows(() => tauntTest.playCard(0, 0, null), "A board with two Taunt cards should reject a third Taunt.");

  const chargeTest = new Game("CHARGE", "Charge1", "Charge2", {
    decks: [
      Array(20).fill("base:beitsas"),
      Array(20).fill("base:aleex"),
    ],
  });
  chargeTest.players[0].board = [
    testMinion("c1", "base:beitsas", ["charge"]),
  ];
  chargeTest.players[0].hand = ["base:kurzemnieks"];
  chargeTest.players[0].manaCurrent = 10;
  assertThrows(() => chargeTest.playCard(0, 0, null), "A board with one Charge card should reject a second Charge.");

  const summonLimitTest = new Game("SUMMON", "Summon1", "Summon2", {
    decks: [
      Array(20).fill("base:aleex"),
      Array(20).fill("base:aleex"),
    ],
  });
  summonLimitTest.players[0].board = Array.from({ length: 4 }, (_, idx) => testMinion(`s${idx}`));
  summonLimitTest._triggerAbilities(
    { abilities: [{ trigger: "test", effect: "summonMinion", cardId: "base:aleex", count: 2 }] },
    "test",
    { casterIdx: 0, sourceName: "Summon Test" }
  );
  assert(summonLimitTest.players[0].board.length === 5, "Summons may exceed the played-card board limit by exactly one.");

  const mostorTest = new Game("MOSTOR", "Mostor1", "Mostor2", {
    decks: [
      Array(20).fill("base:aleex"),
      Array(20).fill("base:aleex"),
    ],
  });
  mostorTest.players[0].hand = ["base:mostor"];
  mostorTest.players[0].deck = [];
  mostorTest.players[0].board = [];
  mostorTest.players[0].manaCurrent = 10;
  mostorTest.playCard(0, 0, null);
  assert(mostorTest.players[0].board.length === 1, "Mostor should stay on board when played the first time.");
  mostorTest._damageMinion(0, mostorTest.players[0].board[0], 99);
  assert(mostorTest.players[0].board.length === 0, "Mostor should leave the board after its first death.");
  assert(mostorTest.players[0].deck.length === 1, "Mostor should return to the deck after its first death.");
  mostorTest._draw(0, 1);
  assert(mostorTest.getStateFor(0).me.hand[0].id === "base:mostor", "Returned Mostor should be drawable and playable.");
  mostorTest.players[0].manaCurrent = 10;
  mostorTest.playCard(0, 0, null);
  assert(mostorTest.players[0].board.length === 1, "Returned Mostor should not destroy itself when played again.");
  mostorTest._damageMinion(0, mostorTest.players[0].board[0], 99);
  assert(mostorTest.players[0].board.length === 0, "Mostor should leave the board after its second death.");
  assert(mostorTest.players[0].deck.length === 0, "Mostor should disappear after its second death.");

  const fullHandDrawTest = new Game("FULLHAND", "FullHand1", "FullHand2", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
  fullHandDrawTest.players[0].hand = Array(10).fill("base:babu");
  fullHandDrawTest.players[0].deck = ["base:mostor", "base:aleex"];
  assert(fullHandDrawTest._draw(0, 1) === 0, "A full hand should block the draw.");
  assert(fullHandDrawTest.players[0].deck.length === 2, "A blocked draw should not remove a deck card.");
  assert(fullHandDrawTest.players[0].deck[0] === "base:mostor", "The blocked draw should preserve the next deck card.");
  fullHandDrawTest.players[0].hand.pop();
  assert(fullHandDrawTest._draw(0, 1) === 1, "Freeing hand space should allow the next draw.");
  assert(fullHandDrawTest.players[0].hand.at(-1) === "base:mostor", "The preserved top card should be drawn after hand space is freed.");

  const fullHandAbilityDrawTest = new Game("FULLABILITY", "Ability1", "Ability2", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
  fullHandAbilityDrawTest.players[0].hand = Array(10).fill("base:babu");
  fullHandAbilityDrawTest.players[0].deck = ["base:aleex", "base:mostor"];
  fullHandAbilityDrawTest._triggerAbilities(
    { abilities: [{ trigger: "test", effect: "drawNonLegendaryNonMythicCard" }] },
    "test",
    { casterIdx: 0, sourceName: "Full Hand Draw Test" }
  );
  assert(fullHandAbilityDrawTest.players[0].deck.length === 2, "A full hand should not burn searched deck draws.");
  fullHandAbilityDrawTest._triggerAbilities(
    { abilities: [{ trigger: "test", effect: "drawRandomDeckCards", value: 2 }] },
    "test",
    { casterIdx: 0, sourceName: "Full Hand Random Draw Test" }
  );
  assert(fullHandAbilityDrawTest.players[0].deck.length === 2, "A full hand should not burn random deck draws.");

  const crowleyTest = new Game("CROWLEY", "Crowley1", "Crowley2", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
  const shieldedAlly = testMinion("crowley-ally");
  const enemyMinion = testMinion("crowley-enemy");
  crowleyTest.players[0].board = [shieldedAlly];
  crowleyTest.players[1].board = [enemyMinion];
  crowleyTest.players[0].hand = ["expansion1:crowley-the-penguin"];
  crowleyTest.players[0].manaCurrent = 10;
  crowleyTest.playCard(0, 0, null);
  assert(shieldedAlly.divineShield, "Crowley's first play should shield existing friendly minions.");
  assert(crowleyTest.players[0].board[1].divineShield, "Crowley should shield itself on first play.");
  assert(!enemyMinion.divineShield, "Crowley should never shield enemy minions.");
  crowleyTest._damageMinion(0, shieldedAlly, 1);
  assert(shieldedAlly.health === 1 && !shieldedAlly.divineShield, "Divine Shield should absorb the first hit.");

  crowleyTest.players[0].board.forEach((minion) => {
    minion.divineShield = false;
    minion.keywords = minion.keywords.filter((keyword) => keyword !== "divineShield");
  });
  crowleyTest.players[0].hand = ["expansion1:crowley-the-penguin"];
  crowleyTest.players[0].manaCurrent = 10;
  crowleyTest.playCard(0, 0, null);
  assert(!shieldedAlly.divineShield, "Crowley's effect should not repeat on a later play.");
  assert(!crowleyTest.players[0].board[2].divineShield, "Later Crowleys should not gain the first-play shield.");

  const redTest = new Game("RED", "Red1", "Red2", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
  redTest.players[0].board = [testMinion("red", "expansion1:red")];
  redTest.endTurn(0);
  redTest.endTurn(1);
  let redWolf = redTest.players[0].board.find((minion) => minion.cardId === "special:redwolf");
  assert(redWolf && redWolf.attack === 5 && redWolf.health === 6, "Red should summon a 5/6 RedWolf on its owner's turn.");
  assert(redWolf.keywords.includes("taunt"), "RedWolf should have Taunt.");
  redTest.endTurn(0);
  redTest.endTurn(1);
  assert(redTest.players[0].board.filter((minion) => minion.cardId === "special:redwolf").length === 1, "Red should not summon a second RedWolf while one remains.");
  redTest._damageMinion(0, redWolf, 99);
  assert(!redTest.players[0].board.some((minion) => minion.cardId === "special:redwolf"), "RedWolf should be removable.");
  redTest.endTurn(0);
  redTest.endTurn(1);
  redWolf = redTest.players[0].board.find((minion) => minion.cardId === "special:redwolf");
  assert(redWolf, "Red should summon a replacement RedWolf after the previous one dies.");

  const staleSocket = { roomCode: "NPC1", playerIdx: 0 };
  const staleSingleplayerRoom = {
    game: { roomCode: "NPC1", winner: null },
    mode: "singleplayer",
    sockets: [staleSocket, null],
    userIds: ["player-1", null],
  };
  const staleRooms = new Map([["NPC1", staleSingleplayerRoom]]);
  let clearedSingleplayerTimer = false;
  let clearedSingleplayerReconnects = false;
  assert(
    discardActiveSingleplayerMatch(staleRooms, "player-1", {
      clearTurnTimer: () => { clearedSingleplayerTimer = true; },
      clearAllReconnectGraces: () => { clearedSingleplayerReconnects = true; },
    }),
    "Starting singleplayer should replace a stale singleplayer room."
  );
  assert(!staleRooms.has("NPC1") && staleSocket.roomCode === null, "Replacing singleplayer should release its room and socket.");
  assert(clearedSingleplayerTimer && clearedSingleplayerReconnects, "Replacing singleplayer should clear timers and reconnect state.");

  const statusTest = new Game("STATUS", "Status1", "Status2", {
    decks: [Array(20).fill("base:aleex"), Array(20).fill("base:aleex")],
  });
  const target = testMinion("status-target");
  target.attack = 5;
  target.health = 8;
  target.maxHealth = 8;
  target.canAttack = true;
  statusTest.players[1].board = [target];

  statusTest._applyStatus(1, target, { status: "weakened", value: 2, turns: 1 });
  assert(target.attack === 3, "Weakened should immediately reduce attack.");
  statusTest.endTurn(0);
  assert(target.attack === 3, "Weakened should remain through the affected player's turn.");
  statusTest.endTurn(1);
  assert(target.attack === 5, "Weakened should restore attack when it expires.");

  statusTest._applyStatus(1, target, { status: "frozen", turns: 1 });
  statusTest.endTurn(0);
  assert(target.canAttack === false, "Frozen should prevent attacks on the affected player's turn.");
  statusTest.endTurn(1);
  statusTest.endTurn(0);
  assert(target.canAttack === true, "Frozen should allow attacks again after it expires.");

  target.health = 8;
  statusTest._applyStatus(1, target, { status: "poisoned", value: 2, turns: 2 });
  statusTest.endTurn(1);
  statusTest.endTurn(0);
  assert(target.health === 6, "Poisoned should deal damage at the start of the affected player's turn.");

  statusTest._applyStatus(1, target, { status: "marked", value: 2 });
  statusTest._damageMinion(1, target, 1);
  assert(target.health === 3, "Marked should increase the next incoming damage.");
  assert(!target.statuses.some((status) => status.type === "marked"), "Marked should be consumed by damage.");

  target.keywords = ["taunt", "divineShield"];
  target.divineShield = true;
  statusTest._applyStatus(1, target, { status: "silenced" });
  assert(target.keywords.length === 0 && !target.divineShield, "Silenced should remove keywords and Divine Shield.");

  console.log("--- TEST OK ---");
}

function assertThrows(fn, message) {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

try {
  main();
} catch (err) {
  console.error("TEST FAILED:", err);
  process.exit(1);
}
