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
  const BOARD_KEYWORD_LIMITS = { taunt: 2, charge: 3 };
  const MAX_NPC_MYTHICS_ON_BOARD = 1;

  function canFitMinionOnBoard(board, card) {
    if (card.type !== "minion") return true;
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

  function pickBestAffordable(hand, manaCurrent, board) {
    let bestIdx = -1;
    let bestCost = -1;
    hand.forEach((card, idx) => {
      if (card.cost > manaCurrent) return;
      if (!canFitMinionOnBoard(board, card)) return;
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

      const idx = pickBestAffordable(state.me.hand, state.me.manaCurrent, state.me.board);
      if (idx !== -1) {
        const card = state.me.hand[idx];
        let played = true;
        try {
          if (card.type === "minion") {
            game.playCard(npcIdx, idx, null);
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
