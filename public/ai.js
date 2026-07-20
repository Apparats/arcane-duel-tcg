// ============================================================
// SIMPLE AI FOR "VS NPC" MODE (client-side only, no server).
// Basic heuristics, no minimax: dumps cards, attacks face unless
// there's an enemy Taunt, and ends turn. Enough to practice the
// engine / test cards before the event.
// ============================================================

(function (root) {
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Picks the most expensive playable card the NPC can afford
  // (prioritizes getting the most value out of its available mana).
  const MAX_BOARD = 4;
  const MAX_HAND = 10;
  const BOARD_KEYWORD_LIMITS = { taunt: 2, charge: 1 };
  const MAX_NPC_MYTHICS_ON_BOARD = 1;
  const BABU2_CARD_ID = "expansion2:Babu2";

  function hasBabuBoardLock(board) {
    return (board || []).some((minion) => minion.cardId === BABU2_CARD_ID);
  }

  function cardReturnsOtherFriendlyMinionsToHand(card) {
    return Boolean(card?.abilities?.some((ability) => ability.effect === "returnOtherFriendlyMinionsToHand"));
  }

  function canFitMinionOnBoard(board, card, hand = []) {
    if (card.type !== "minion") return true;
    if (hasBabuBoardLock(board)) return false;
    if (cardReturnsOtherFriendlyMinionsToHand(card)) {
      return Math.max(0, hand.length - 1) + board.length <= MAX_HAND;
    }
    if (board.length >= MAX_BOARD) return false;
    if (
      card.rarity === "mythic" &&
      board.filter((minion) => minion.rarity === "mythic").length >= MAX_NPC_MYTHICS_ON_BOARD
    ) return false;
    const keywords = card.keywords || [];
    return Object.entries(BOARD_KEYWORD_LIMITS).every(([keyword, limit]) => {
      if (!keywords.includes(keyword)) return true;
      return board.filter((minion) => minion.keywords.includes(keyword)).length < limit;
    });
  }

  function cardRequiresEnemyMinionTarget(card) {
    return (card.abilities || []).some((ability) =>
      ability.trigger === "onPlay" && ability.target === "enemyMinion" &&
      ["applyStatus", "returnEnemyMinionToDeck"].includes(ability.effect)
    );
  }

  function cardTargetsEnemyOnly(card) {
    return (card.abilities || []).some((ability) =>
      ability.trigger === "onPlay" &&
      (
        ability.effect === "returnEnemyMinionToDeck" ||
        (ability.effect === "applyStatus" && ["enemyMinion", "enemy", "enemyCharacter", "enemyHero"].includes(ability.target))
      )
    );
  }

  function cardRequiresPlayTarget(card) {
    return cardTargetsEnemyOnly(card);
  }

  function pickBestAffordable(hand, manaCurrent, board, enemyBoard) {
    let bestIdx = -1;
    let bestCost = -1;
    hand.forEach((card, idx) => {
      if (card.type !== "minion") return;
      if (card.cost > manaCurrent) return;
      if (!canFitMinionOnBoard(board, card, hand)) return;
      if (cardRequiresEnemyMinionTarget(card) && enemyBoard.length === 0) return;
      if (card.cost > bestCost) {
        bestCost = card.cost;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }

  async function npcTakeTurn(game, npcIdx, opts = {}) {
    const { onStep, stepDelay = 550 } = opts;
    const step = async () => {
      if (onStep) onStep();
      await sleep(stepDelay);
    };

    // ---- Phase 1: play one card ----
    {
      const state = game.getStateFor(npcIdx);
      if (state.winner !== null) return;

      const idx = pickBestAffordable(state.me.hand, state.me.manaCurrent, state.me.board, state.opponent.board);
      if (idx !== -1) {
        const card = state.me.hand[idx];
        let played = true;
        try {
          if (card.type === "minion") {
            let target = null;
            if (cardRequiresEnemyMinionTarget(card)) {
              target = state.opponent.board.slice().sort((a, b) => b.attack - a.attack || b.health - a.health)[0]?.instanceId;
            } else if (cardRequiresPlayTarget(card)) {
              target = state.opponent.board.slice().sort((a, b) => b.attack - a.attack || b.health - a.health)[0]?.instanceId || "faceEnemy";
            }
            game.playCard(npcIdx, idx, target);
          } else if (card.effect === "draw") {
            game.playCard(npcIdx, idx, null);
          } else if (card.effect === "heal") {
            // Only heal if it actually helps; otherwise avoid wasting the card.
            if (state.me.health < state.me.maxHealth) {
              game.playCard(npcIdx, idx, null); // no target = heals its own hero
            } else {
              played = false;
            }
          } else if (card.effect === "damage") {
            game.playCard(npcIdx, idx, "faceEnemy");
          } else {
            played = false;
          }
        } catch (err) {
          played = false;
        }

        if (played) await step();
      }
    }

    // ---- Phase 2: attack ----
    let attackGuard = 0;
    while (attackGuard++ < 12) {
      const state = game.getStateFor(npcIdx);
      if (state.winner !== null) return;

      const attacker = state.me.board.find((m) => m.canAttack && m.attack > 0);
      if (!attacker) break;

      const enemyTaunts = state.opponent.board.filter((m) => m.keywords.includes("taunt"));
      let targetId = "face";
      if (enemyTaunts.length > 0) {
        enemyTaunts.sort((a, b) => b.health - a.health);
        targetId = enemyTaunts[0].instanceId;
      }

      try {
        game.attack(npcIdx, attacker.instanceId, targetId);
      } catch (err) {
        break;
      }
      await step();
    }

    // ---- Phase 3: end turn ----
    try {
      game.endTurn(npcIdx);
    } catch (err) {
      // The match may have already ended from the last attack; that's fine.
    }
    if (onStep) onStep();
  }

  root.TCGAi = { npcTakeTurn };
})(typeof window !== "undefined" ? window : this);
