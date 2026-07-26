// ============================================================
// SHARED NPC AI
// Greedy, shallow heuristics only: no minimax and no future-turn tree.
// Used by browser local NPC and by the server NPC/campaign runner.
// ============================================================

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./cards"));
  } else {
    root.TCGAi = factory(root.TCGCards);
  }
})(typeof self !== "undefined" ? self : this, function (CardsModule) {
  const { getCardById } = CardsModule;

  const MAX_HAND = 10;
  const DEFAULT_MAX_CARD_PLAYS = 6;
  const MAX_ATTACKS = 12;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function opponentIdx(game, playerIdx) {
    return typeof game._opponentIdx === "function" ? game._opponentIdx(playerIdx) : playerIdx === 0 ? 1 : 0;
  }

  function cardIdFromRef(cardRef) {
    return String(cardRef || "").split("|")[0];
  }

  function statModifiersFromRef(cardRef) {
    return String(cardRef || "").split("|").slice(1).reduce((mods, segment) => {
      if (segment.startsWith("attack:")) {
        const value = Number(segment.slice("attack:".length));
        if (Number.isInteger(value)) mods.attack = value;
      }
      if (segment.startsWith("health:")) {
        const value = Number(segment.slice("health:".length));
        if (Number.isInteger(value)) mods.health = value;
      }
      return mods;
    }, { attack: 0, health: 0 });
  }

  function costModifierFromRef(cardRef) {
    const segment = String(cardRef || "").split("|").find((part) => part.startsWith("cost:"));
    const value = Number(segment ? segment.slice("cost:".length) : 0);
    return Number.isInteger(value) ? value : 0;
  }

  function cardFromHandRef(cardRef) {
    if (typeof cardRef !== "string") return cardRef;
    const card = getCardById(cardIdFromRef(cardRef));
    if (!card) return card;
    const modifiers = statModifiersFromRef(cardRef);
    const costModifier = costModifierFromRef(cardRef);
    if (!modifiers.attack && !modifiers.health && !costModifier) return card;
    return {
      ...card,
      cost: Math.max(0, (card.cost || 0) + costModifier),
      attack: card.type === "minion" ? Math.max(0, (card.attack || 0) + modifiers.attack) : card.attack,
      health: card.type === "minion" ? Math.max(1, (card.health || 1) + modifiers.health) : card.health,
    };
  }

  function cardCanTargetEnemyHero(card) {
    return (card?.abilities || []).some((ability) =>
      ability.trigger === "onPlay" &&
      ability.effect === "applyStatus" &&
      ability.status === "poisoned" &&
      ["enemyHero", "enemy", "enemyCharacter"].includes(ability.target)
    );
  }

  function cardRequiresEnemyMinionTarget(card) {
    return (card?.abilities || []).some((ability) => {
      if (ability.trigger !== "onPlay") return false;
      if (ability.effect === "returnEnemyMinionToDeck") return true;
      if (ability.effect !== "applyStatus") return false;
      if (ability.target === "enemyMinion") return true;
      return ["enemy", "enemyCharacter"].includes(ability.target) && !cardCanTargetEnemyHero(card);
    });
  }

  function cardRequiresFriendlyMinionTarget(card) {
    return (card?.abilities || []).some((ability) =>
      ability.trigger === "onPlay" &&
      ability.effect === "cleanseFriendlyMinion" &&
      ability.target === "friendlyMinion"
    );
  }

  function cardRequiresMinionTarget(card) {
    return (card?.abilities || []).some((ability) =>
      ability.trigger === "onPlay" &&
      ability.effect === "healTargetMinion" &&
      ability.target === "minion"
    );
  }

  function cardRequiresPlayTarget(card) {
    if (card?.effect === "damage" || card?.effect === "heal") return true;
    return (card?.abilities || []).some((ability) =>
      ability.trigger === "onPlay" &&
      (
        ability.effect === "returnEnemyMinionToDeck" ||
        (ability.effect === "healTargetMinion" && ability.target === "minion") ||
        (ability.effect === "cleanseFriendlyMinion" && ability.target === "friendlyMinion") ||
        (ability.effect === "applyStatus" && ["enemyMinion", "enemy", "enemyCharacter", "enemyHero"].includes(ability.target))
      )
    );
  }

  function minionCannotBeAttacked(minion) {
    if ((minion?.statuses || []).some((status) => status.type === "silenced")) return false;
    const cardDef = getCardById(minion?.cardId);
    return Boolean(cardDef?.abilities?.some((ability) => ability.effect === "unattackable"));
  }

  function minionValue(minion) {
    if (!minion) return 0;
    const attack = Math.max(0, minion.attack || 0);
    const health = Math.max(0, minion.health || 0);
    const taunt = (minion.keywords || []).includes("taunt") ? 8 : 0;
    const charge = (minion.keywords || []).includes("charge") ? 3 : 0;
    const shield = minion.divineShield ? 5 : 0;
    return attack * 3 + health + taunt + charge + shield;
  }

  function strongestMinion(board) {
    return (board || []).slice().sort((left, right) =>
      minionValue(right) - minionValue(left) ||
      (right.attack || 0) - (left.attack || 0) ||
      (right.health || 0) - (left.health || 0)
    )[0] || null;
  }

  function eligibleEnemyHandStealTargets(game, playerIdx) {
    const enemy = game.players[opponentIdx(game, playerIdx)];
    return (enemy.hand || [])
      .map((cardRef) => cardFromHandRef(cardRef))
      .filter((card) => card && card.rarity !== "mythic" && card.rarity !== "legendary");
  }

  function bestDamageTarget(game, playerIdx, card) {
    const enemyIdx = opponentIdx(game, playerIdx);
    const enemy = game.players[enemyIdx];
    const damage = Math.max(0, card.value || 0);
    if (damage >= enemy.health) return "faceEnemy";
    const kill = strongestMinion((enemy.board || []).filter((minion) => minion.health <= damage));
    return kill?.instanceId || "faceEnemy";
  }

  function bestHealTarget(game, playerIdx, card) {
    const player = game.players[playerIdx];
    const heal = Math.max(0, card.value || 0);
    const damagedAlly = (player.board || [])
      .filter((minion) => minion.health < minion.maxHealth)
      .sort((left, right) => (right.maxHealth - right.health) - (left.maxHealth - left.health) || minionValue(right) - minionValue(left))[0];
    if (damagedAlly) return damagedAlly.instanceId;
    return player.health <= player.maxHealth - Math.max(1, heal) ? null : undefined;
  }

  function npcCardTarget(game, card, playerIdx = 1) {
    const player = game.players[playerIdx];
    const enemy = game.players[opponentIdx(game, playerIdx)];
    const target = strongestMinion(enemy.board || []);
    if (cardRequiresFriendlyMinionTarget(card)) {
      const negativeStatuses = new Set(["weakened", "frozen", "silenced", "poisoned", "marked", "burning", "drunk", "confused"]);
      return (player.board || []).find((minion) => (minion.statuses || []).some((status) => negativeStatuses.has(status.type)))?.instanceId || null;
    }
    if (cardRequiresMinionTarget(card)) {
      const damagedAlly = (player.board || [])
        .filter((minion) => minion.health < minion.maxHealth)
        .sort((left, right) => (right.maxHealth - right.health) - (left.maxHealth - left.health) || minionValue(right) - minionValue(left))[0];
      return damagedAlly?.instanceId || strongestMinion(player.board || [])?.instanceId || target?.instanceId || null;
    }
    if (cardRequiresEnemyMinionTarget(card)) return target?.instanceId || null;
    if (card?.effect === "damage") return bestDamageTarget(game, playerIdx, card);
    if (card?.effect === "heal") return bestHealTarget(game, playerIdx, card);
    if (cardRequiresPlayTarget(card)) return target?.instanceId || (cardCanTargetEnemyHero(card) ? "faceEnemy" : null);
    return null;
  }

  function hasUsefulSpellTarget(game, playerIdx, card, target) {
    const player = game.players[playerIdx];
    if (card.effect === "draw") return player.hand.length <= MAX_HAND - Math.max(1, card.value || 1);
    if (card.effect === "damage") return target !== null && target !== undefined;
    if (card.effect === "heal") return target !== undefined;
    return false;
  }

  function cardScore(game, playerIdx, card, target) {
    const player = game.players[playerIdx];
    const enemy = game.players[opponentIdx(game, playerIdx)];
    const manaAfter = Math.max(0, player.manaCurrent - (card.cost || 0));
    let score = Math.max(0, card.cost || 0) * 1.2 - manaAfter * 0.25;

    if (card.type === "minion") {
      score += Math.max(0, card.attack || 0) * 2 + Math.max(0, card.health || 0);
      if ((card.keywords || []).includes("taunt")) score += 5;
      if ((card.keywords || []).includes("charge")) score += 4;
      if (card.rarity === "mythic") score += 3;
    }

    if (card.effect === "draw") score += Math.max(1, card.value || 1) * 4;
    if (card.effect === "damage") {
      const damage = Math.max(0, card.value || 0);
      if (target === "faceEnemy" && damage >= enemy.health) return 10000 + damage;
      const minion = target && target !== "faceEnemy" ? enemy.board.find((item) => item.instanceId === target) : null;
      score += minion ? (minion.health <= damage ? minionValue(minion) + 8 : damage * 2) : damage * 1.5;
    }
    if (card.effect === "heal") {
      const damagedHero = Math.max(0, player.maxHealth - player.health);
      score += target === null ? damagedHero * 1.4 : 5;
    }

    (card.abilities || []).forEach((ability) => {
      if (ability.trigger !== "onPlay") return;
      if (ability.effect === "returnEnemyMinionToDeck") {
        const minion = enemy.board.find((item) => item.instanceId === target);
        score += minion ? minionValue(minion) + 10 : 0;
      }
      if (ability.effect === "applyStatus") {
        const minion = enemy.board.find((item) => item.instanceId === target);
        if (minion) score += minionValue(minion) * 0.8 + Math.max(1, ability.value || 1) * Math.max(1, ability.turns || 1);
        else if (target === "faceEnemy") score += Math.max(1, ability.value || 1) * Math.max(1, ability.turns || 1);
      }
      if (ability.effect === "damageEnemyHero") score += Math.max(1, ability.value || 1) * 2;
      if (ability.effect === "drawCards") score += Math.max(1, ability.value || 1) * 4;
      if (ability.effect === "drawNonLegendaryNonMythicCard") score += 4;
      if (ability.effect === "drawRandomDeckCards") score += Math.max(1, ability.value || 1) * 4;
      if (ability.effect === "cleanseFriendlyMinion") score += target ? 8 : 0;
      if (ability.effect === "healTargetMinion") score += target ? Math.max(1, ability.value || 1) * 2 + 2 : 0;
      if (ability.effect === "grantChargeToRandomFriendlyNonCharge") score += (player.board || []).some((minion) => !(minion.keywords || []).includes("charge")) ? 6 : 0;
      if (ability.effect === "gainTemporaryMana") score += Math.max(1, ability.value || 1) * 2;
      if (ability.effect === "stealHealthFromRandomEnemyHandMinionAsAttack") score += (enemy.hand || []).length > 0 ? 5 : 0;
      if (ability.effect === "grantDodgeToFriendlyBoardFirstPlay") score += (player.board || []).length * 4 + 6;
      if (ability.effect === "increaseSelfDodgeOnKill") score += 3;
      if (ability.effect === "stealRandomEnemyHandNonMythicCardBuffed") {
        const eligibleTargets = eligibleEnemyHandStealTargets(game, playerIdx);
        score += player.hand.length < MAX_HAND && eligibleTargets.length > 0 ? 8 + eligibleTargets.length * 2 : 0;
      }
      if (ability.effect === "startDelayedSelfBuff") score += ((ability.attack || 0) * 2 + (ability.health || 0)) * 0.5;
      if (ability.effect === "swapSelfStatsIfBoardHasAtLeast") score += (player.board || []).length >= Math.max(1, ability.value || 1) - 1 ? 10 : 0;
      if (ability.effect === "buffAllFriendlyMinions") score += (player.board || []).length * ((ability.attack || 0) * 2 + (ability.health || 0));
    });

    return score;
  }

  function chooseNpcPlayable(game, { playerIdx = 1, limitMythics = false } = {}) {
    const player = game.players[playerIdx];
    const hasMythicInPlay = limitMythics && player.board.some((minion) => minion.rarity === "mythic");
    let best = null;

    player.hand.forEach((cardRef, handIndex) => {
      const card = cardFromHandRef(cardRef);
      if (!card || card.cost > player.manaCurrent) return;
      if (typeof game.getCardPlayError === "function" && game.getCardPlayError(playerIdx, card)) return;
      if (card.type === "minion") {
        if (hasMythicInPlay && card.rarity === "mythic") return;
        if (typeof game.getCardPlayError !== "function" && typeof game.getBoardLimitError === "function" && game.getBoardLimitError(playerIdx, card)) return;
      } else if (card.type !== "spell") {
        return;
      }

      const target = npcCardTarget(game, card, playerIdx);
      if (cardRequiresEnemyMinionTarget(card) && !target) return;
      if (cardRequiresFriendlyMinionTarget(card) && !target) return;
      if (cardRequiresMinionTarget(card) && !target) return;
      if (cardRequiresPlayTarget(card) && target === null && card.type !== "spell" && !cardCanTargetEnemyHero(card)) return;
      if (card.type === "spell" && !hasUsefulSpellTarget(game, playerIdx, card, target)) return;

      const score = cardScore(game, playerIdx, card, target);
      if (!best || score > best.score || (score === best.score && card.cost > best.card.cost)) {
        best = { card, handIndex, target, score };
      }
    });

    return best && best.score > 0 ? best : null;
  }

  function chooseNpcAttack(game, playerIdx = 1) {
    const player = game.players[playerIdx];
    const enemy = game.players[opponentIdx(game, playerIdx)];
    const attackers = (player.board || []).filter((minion) => minion.canAttack && minion.attack > 0);
    if (attackers.length === 0) return null;

    const attackableEnemyBoard = (enemy.board || []).filter((minion) => !minionCannotBeAttacked(minion));
    const taunts = attackableEnemyBoard.filter((minion) => (minion.keywords || []).includes("taunt"));
    const totalReadyAttack = attackers.reduce((sum, minion) => sum + Math.max(0, minion.attack || 0), 0);
    const lethalAvailable = taunts.length === 0 && totalReadyAttack >= enemy.health;
    let best = null;

    attackers.forEach((attacker) => {
      if (lethalAvailable && attacker.attack >= enemy.health) {
        best = { attacker, targetInstanceId: "face", score: 10000 + attacker.attack };
        return;
      }

      const candidates = taunts.length > 0 ? taunts : attackableEnemyBoard;
      candidates.forEach((target) => {
        const killsTarget = attacker.attack >= target.health || target.divineShield;
        const survives = target.divineShield ? true : attacker.health > (target.attack || 0);
        const tradesUp = minionValue(target) >= minionValue(attacker) * 0.75;
        let score = killsTarget ? minionValue(target) + 8 : attacker.attack * 1.5;
        if (survives) score += 5;
        if (!survives && !tradesUp) score -= 8;
        if ((target.keywords || []).includes("taunt")) score += 6;
        if (!best || score > best.score) best = { attacker, targetInstanceId: target.instanceId, score };
      });

      if (taunts.length === 0) {
        const faceScore = lethalAvailable ? 9000 + attacker.attack : attacker.attack * 2.2;
        if (!best || faceScore > best.score) best = { attacker, targetInstanceId: "face", score: faceScore };
      }
    });

    return best ? { attackerInstanceId: best.attacker.instanceId, targetInstanceId: best.targetInstanceId } : null;
  }

  async function npcTakeTurn(game, npcIdx, opts = {}) {
    const {
      onStep,
      stepDelay = 550,
      maxCardPlays = DEFAULT_MAX_CARD_PLAYS,
      limitMythics = true,
      onBeforePlay,
      onAfterPlay,
      onAfterAttack,
    } = opts;
    const step = async () => {
      if (onStep) onStep();
      if (stepDelay > 0) await sleep(stepDelay);
    };

    let playGuard = 0;
    while (game.winner === null && game.turn === npcIdx && playGuard++ < maxCardPlays) {
      const play = chooseNpcPlayable(game, { playerIdx: npcIdx, limitMythics });
      if (!play) break;
      try {
        if (onBeforePlay) await onBeforePlay(play);
        game.playCard(npcIdx, play.handIndex, play.target);
        if (onAfterPlay) await onAfterPlay(play);
        await step();
      } catch (err) {
        break;
      }
    }

    let attackGuard = 0;
    while (game.winner === null && game.turn === npcIdx && attackGuard++ < MAX_ATTACKS) {
      const attack = chooseNpcAttack(game, npcIdx);
      if (!attack) break;
      try {
        game.attack(npcIdx, attack.attackerInstanceId, attack.targetInstanceId);
        if (onAfterAttack) await onAfterAttack(attack);
        await step();
      } catch (err) {
        break;
      }
    }

    try {
      if (game.winner === null && game.turn === npcIdx) game.endTurn(npcIdx);
    } catch (err) {
      // The match may have already ended from the last action.
    }
    if (onStep) onStep();
  }

  return {
    npcTakeTurn,
    chooseNpcPlayable,
    chooseNpcAttack,
    npcCardTarget,
    cardCanTargetEnemyHero,
    cardRequiresEnemyMinionTarget,
    cardRequiresFriendlyMinionTarget,
    cardRequiresPlayTarget,
  };
});
