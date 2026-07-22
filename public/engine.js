// ============================================================
// GAME ENGINE — authoritative. Shared between:
//   - server/index.js (online mode, runs in Node)
//   - public/client.js (local vs NPC mode, runs in the browser)
// The logic is identical in both cases; the only thing that changes
// is who calls the playCard/attack/endTurn methods on each side.
// ============================================================

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./cards"));
  } else {
    root.TCGEngine = factory(root.TCGCards);
  }
})(typeof self !== "undefined" ? self : this, function (CardsModule) {

  const { CARDS, getCardById, buildStarterDeck } = CardsModule;

  const MAX_MANA = 10;
  const START_HEALTH = 30;
  const START_HAND = 3; // player 2 draws one extra card (compensation for going 2nd)
  const SECOND_PLAYER_MANA_CARD_ID = "special:manaspark";
  const MAX_HAND = 10;
  const MAX_BOARD = 4;
  const BOARD_KEYWORD_LIMITS = {
    taunt: 2,
    charge: 1,
  };
  const STATUS_TYPES = new Set(["weakened", "frozen", "silenced", "poisoned", "marked", "burning"]);
  const ENEMY_CHARACTER_TARGETS = new Set(["enemy", "enemyCharacter"]);
  const BABU2_CARD_ID = "expansion2:Babu2";

  function shuffle(arr, randomInt = (maxExclusive) => Math.floor(Math.random() * maxExclusive)) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function fallbackDeck() {
    return buildStarterDeck()
      .filter((cardId) => getCardById(cardId)?.showInInventory !== false)
      .slice(0, 20);
  }

  const CARD_REF_RETURN_SEPARATOR = "|returns:";

  function cardIdFromRef(cardRef) {
    return String(cardRef || "").split(CARD_REF_RETURN_SEPARATOR)[0];
  }

  function returnCountFromRef(cardRef) {
    const parts = String(cardRef || "").split(CARD_REF_RETURN_SEPARATOR);
    const count = Number(parts[1] || 0);
    return Number.isInteger(count) && count > 0 ? count : 0;
  }

  function cardRefWithReturnCount(cardId, returnCount) {
    return returnCount > 0 ? `${cardId}${CARD_REF_RETURN_SEPARATOR}${returnCount}` : cardId;
  }

  function applyOverflowHeal(target, amount) {
    target.health += amount;
  }

  function applyHeroHeal(target, amount) {
    target.health = Math.min(target.maxHealth, target.health + amount);
  }

  function boundedInteger(value, fallback, min, max) {
    return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  }

  function abilityCanTargetEnemyHero(ability) {
    return ability?.target === "enemyHero" || ENEMY_CHARACTER_TARGETS.has(ability?.target);
  }

  function abilityCanTargetEnemyMinion(ability) {
    return ability?.target === "enemyMinion" || ENEMY_CHARACTER_TARGETS.has(ability?.target);
  }

  function hasBabuBoardLock(player) {
    return (player?.board || []).some((minion) => minion.cardId === BABU2_CARD_ID);
  }

  function cardReturnsOtherFriendlyMinionsToHand(cardDef) {
    return Boolean(cardDef?.abilities?.some((ability) => ability.effect === "returnOtherFriendlyMinionsToHand"));
  }

  function minionPreventsDamageFromRace(minion, sourceRace) {
    if (!sourceRace || (minion.statuses || []).some((status) => status.type === "silenced")) return false;
    const cardDef = getCardById(minion.cardId);
    const normalizedSourceRace = String(sourceRace).toLowerCase();
    return Boolean(cardDef?.abilities?.some((ability) =>
      ability.effect === "preventDamageFromRace" &&
      String(ability.race || "").toLowerCase() === normalizedSourceRace
    ));
  }

  function minionRevivesOtherFriendlyMinions(minion) {
    if ((minion.statuses || []).some((status) => status.type === "silenced")) return false;
    const cardDef = getCardById(minion.cardId);
    return Boolean(cardDef?.abilities?.some((ability) => ability.effect === "reviveOtherFriendlyMinions"));
  }

  function minionHasTaunt(minion, cardDef = getCardById(minion?.cardId)) {
    return Boolean((minion?.keywords || cardDef?.keywords || []).includes("taunt") || (cardDef?.keywords || []).includes("taunt"));
  }

  function minionAppliesDrunkAura(minion) {
    if ((minion.statuses || []).some((status) => status.type === "silenced")) return false;
    const cardDef = getCardById(minion.cardId);
    return Boolean(cardDef?.abilities?.some((ability) => ability.effect === "drunkAllMinions"));
  }

  function setStatusSourceRace(status, sourceRace) {
    if (!sourceRace) return status;
    Object.defineProperty(status, "sourceRace", {
      value: sourceRace,
      enumerable: false,
      writable: true,
      configurable: true,
    });
    return status;
  }

  function normalizePlayerConfig(config = {}) {
    const maxHealth = boundedInteger(config.maxHealth, START_HEALTH, 1, 999);
    const health = boundedInteger(config.health, maxHealth, 1, maxHealth);
    const manaCap = boundedInteger(config.manaCap, MAX_MANA, 1, 30);
    const startingMana = boundedInteger(config.startingMana, 1, 1, manaCap);
    const boardRules = config.boardRules || {};
    const maxMinions = boardRules.maxMinions === null
      ? null
      : boundedInteger(boardRules.maxMinions, MAX_BOARD, 1, 30);

    return {
      health,
      maxHealth,
      manaCap,
      startingMana,
      ignoreDeckSizeLimit: config.ignoreDeckSizeLimit === true,
      boardRules: {
        maxMinions,
        allowExtraSummonSlot: boardRules.allowExtraSummonSlot !== false,
        ignoreKeywordLimits: boardRules.ignoreKeywordLimits === true,
      },
    };
  }

  function makePlayer(name, deckIds = null, randomInt, config = {}) {
    const settings = normalizePlayerConfig(config);
    const sourceDeck = deckIds && deckIds.length ? deckIds : fallbackDeck();
    const deck = settings.ignoreDeckSizeLimit ? sourceDeck.slice() : sourceDeck.slice(0, 20);
    return {
      name,
      health: settings.health,
      maxHealth: settings.maxHealth,
      // _startTurn increments mana before the player acts. Store one less so
      // a campaign can define exactly how much mana a hero starts with.
      manaMax: settings.startingMana - 1,
      manaCurrent: 0,
      manaCap: settings.manaCap,
      boardRules: settings.boardRules,
      deck: shuffle(deck, randomInt),
      hand: [],
      board: [], // { instanceId, cardId, attack, health, maxHealth, keywords, canAttack, damaged }
      playedCounts: {},
      statuses: [],
    };
  }

  let instanceCounter = 1;
  function nextInstanceId() {
    return "i" + instanceCounter++;
  }

  // Builds an in-play minion instance from a card definition. Used
  // both when playing a card from hand and when summoning a copy via
  // the "summonMinion" ability.
  function makeMinionInstance(cardDef, extra = {}) {
    const keywords = cardDef.keywords || [];
    return {
      instanceId: nextInstanceId(),
      cardId: cardDef.id,
      name: cardDef.name,
      cost: cardDef.cost,
      attack: cardDef.attack,
      health: cardDef.health,
      maxHealth: cardDef.health,
      keywords: [...keywords],
      canAttack: keywords.includes("charge"),
      divineShield: keywords.includes("divineShield"),
      statuses: [],
      race: cardDef.race,
      rarity: cardDef.rarity,
      country: cardDef.country,
      lore: cardDef.lore,
      image: cardDef.image || null,
      playedCount: extra.playedCount || 0,
      returnCount: extra.returnCount || 0,
      rebirthUsed: extra.rebirthUsed === true,
    };
  }

  function countKeywordOnBoard(board, keyword) {
    return board.filter((minion) => minion.keywords.includes(keyword)).length;
  }

  function boardLimitError(player, cardDef, { summoned = false, ignoreBoardLimit = false, ignoreKeywordLimits = false } = {}) {
    if (cardDef?.type === "minion" && hasBabuBoardLock(player)) return "Babu prevents you from summoning more minions.";
    const rules = player.boardRules || {};
    let boardLimit = rules.maxMinions;
    if (boardLimit === undefined) boardLimit = MAX_BOARD;
    if (!ignoreBoardLimit && boardLimit !== null && summoned && rules.allowExtraSummonSlot !== false) boardLimit += 1;
    if (!ignoreBoardLimit && boardLimit !== null && player.board.length >= boardLimit) return "Board is full.";
    if (ignoreKeywordLimits || rules.ignoreKeywordLimits === true) return null;
    const keywords = cardDef.keywords || [];
    for (const [keyword, limit] of Object.entries(BOARD_KEYWORD_LIMITS)) {
      if (keywords.includes(keyword) && countKeywordOnBoard(player.board, keyword) >= limit) {
        const label = keyword === "taunt" ? "Taunt" : keyword === "charge" ? "Charge" : keyword;
        return `You can only have ${limit} ${label} cards on the board.`;
      }
    }
    return null;
  }

  // ============================================================
  // ABILITIES — declarative system (data-driven, not code-driven).
  // A card can carry "abilities: [{ trigger, effect, ...params }]".
  // These aren't functions because cards go through JSON.stringify
  // in scripts/build-cards.js, so any function would be lost. Instead,
  // each card just NAMES an effect the engine already knows, and the
  // full list of effects that exist today lives right below. Adding a
  // new effect = add a function here + validate it in scripts/build-cards.js.
  //
  // Supported triggers:
  //   "onPlay"      -> when the card is played (minion already on board, or
  //                    right after a spell resolves)
  //   "onDeath"     -> when a minion with this card dies
  //   "onTurnStart" -> at the start of the controlling player's turn, for
  //                    every minion with this card currently on their board
  //                    (fires every turn it's alive, not just once)
  // ============================================================

  const ABILITY_EFFECTS = {
    // Draws cards for whoever played the card. E.g. "generates more cards".
    drawCards(game, ctx, ability) {
      const amount = ability.value || 1;
      game._draw(ctx.casterIdx, amount);
      game._addLog(`${ctx.sourceName}: ${game.players[ctx.casterIdx].name} draws ${amount} card(s).`);
    },

    gainTemporaryMana(game, ctx, ability) {
      const amount = ability.value || 1;
      const player = game.players[ctx.casterIdx];
      player.manaCurrent += amount;
      game._addLog(`${ctx.sourceName} grants ${amount} temporary Mana to ${player.name}.`);
    },

    addCardToHand(game, ctx, ability) {
      const cardDef = getCardById(ability.cardId);
      const player = game.players[ctx.casterIdx];
      if (!cardDef || player.hand.length >= MAX_HAND) {
        if (player.hand.length >= MAX_HAND) game._addLog(`${ctx.sourceName} cannot add a card: hand is full.`);
        return;
      }
      player.hand.push(cardDef.id);
      game._addLog(`${ctx.sourceName} adds ${cardDef.name} to ${player.name}'s hand.`);
    },

    addRandomSpellToHand(game, ctx) {
      const player = game.players[ctx.casterIdx];
      if (player.hand.length >= MAX_HAND) {
        game._addLog(`${ctx.sourceName} cannot add a spell: hand is full.`);
        return;
      }
      const spells = (CARDS || []).filter((card) => card.type === "spell" && card.showInInventory !== false);
      if (spells.length === 0) return;
      const cardDef = spells[game.randomInt(spells.length)];
      player.hand.push(cardDef.id);
      game._addLog(`${ctx.sourceName} adds ${cardDef.name} to ${player.name}'s hand.`);
    },

    stealRandomEnemyDeckCardToHand(game, ctx) {
      const player = game.players[ctx.casterIdx];
      const opponent = game.players[game._opponentIdx(ctx.casterIdx)];
      if (player.hand.length >= MAX_HAND) return;

      const eligibleIndexes = opponent.deck.reduce((indexes, cardRef, index) => {
        const card = getCardById(cardIdFromRef(cardRef));
        if (card && card.rarity !== "mythic") indexes.push(index);
        return indexes;
      }, []);
      if (eligibleIndexes.length === 0) {
        game._addLog(`${ctx.sourceName} finds no non-Mythic cards to steal.`);
        return;
      }

      const index = eligibleIndexes[game.randomInt(eligibleIndexes.length)];
      const [stolenCard] = opponent.deck.splice(index, 1);
      const card = getCardById(cardIdFromRef(stolenCard));
      player.hand.push(stolenCard);
      game._addLog(`${ctx.sourceName} steals ${card.name} from the enemy deck.`);
    },

    stealRandomEnemyBoardMinion(game, ctx) {
      const player = game.players[ctx.casterIdx];
      const opponent = game.players[game._opponentIdx(ctx.casterIdx)];
      const eligibleMinions = opponent.board.filter((minion) => {
        const cardDef = getCardById(minion.cardId);
        return cardDef && cardDef.type === "minion" && !boardLimitError(player, cardDef, { summoned: true });
      });
      if (eligibleMinions.length === 0) {
        game._addLog(`${ctx.sourceName} finds no enemy minion to steal.`);
        return;
      }

      const stolen = eligibleMinions[game.randomInt(eligibleMinions.length)];
      const boardIndex = opponent.board.findIndex((minion) => minion.instanceId === stolen.instanceId);
      if (boardIndex < 0) return;
      opponent.board.splice(boardIndex, 1);
      stolen.canAttack = (stolen.keywords || []).includes("charge");
      player.board.push(stolen);
      game._addLog(`${ctx.sourceName} steals ${stolen.name} from the enemy board.`);
    },

    stealEnemyBoardNonMythicMinions(game, ctx) {
      const player = game.players[ctx.casterIdx];
      const opponent = game.players[game._opponentIdx(ctx.casterIdx)];
      const stolen = [];
      const remaining = [];

      opponent.board.forEach((minion) => {
        const cardDef = getCardById(minion.cardId);
        const isSameCard = minion.cardId === ctx.cardId || minion.instanceId === ctx.instanceId;
        const canSteal = cardDef &&
          cardDef.type === "minion" &&
          cardDef.rarity !== "mythic" &&
          !isSameCard &&
          !boardLimitError(player, cardDef, { summoned: true });

        if (!canSteal) {
          remaining.push(minion);
          return;
        }

        minion.canAttack = (minion.keywords || []).includes("charge");
        player.board.push(minion);
        stolen.push(minion);
      });

      opponent.board = remaining;
      if (stolen.length > 0) {
        game._addLog(`${ctx.sourceName} moves ${stolen.length} enemy minion(s) to your board.`);
      } else {
        game._addLog(`${ctx.sourceName} finds no non-Mythic enemy minions to move.`);
      }
    },

    // AoE damage to ALL enemy minions. E.g. "damages more cards at once".
    damageAllEnemyMinions(game, ctx, ability) {
      const amount = ability.value || 1;
      const oppIdx = game._opponentIdx(ctx.casterIdx);
      const targets = [...game.players[oppIdx].board]; // copy: _damageMinion can mutate the original array
      targets.forEach((m) => game._damageMinion(oppIdx, m, amount, { sourceRace: ctx.sourceRace }));
      game._addLog(`${ctx.sourceName} deals ${amount} damage to all enemy minions.`);
    },

    // AoE damage to ALL minions in play, on both sides.
    damageAllMinions(game, ctx, ability) {
      const amount = ability.value || 1;
      [0, 1].forEach((pi) => {
        const targets = [...game.players[pi].board];
        targets.forEach((m) => game._damageMinion(pi, m, amount, { sourceRace: ctx.sourceRace }));
      });
      game._addLog(`${ctx.sourceName} deals ${amount} damage to all minions in play.`);
    },

    // Direct damage to the enemy hero, no target needed.
    damageEnemyHero(game, ctx, ability) {
      const amount = ability.value || 1;
      const opp = game.players[game._opponentIdx(ctx.casterIdx)];
      opp.health -= amount;
      game._addLog(`${ctx.sourceName} deals ${amount} damage directly to the enemy hero.`);
    },

    // Heals all friendly minions.
    healAllFriendlyMinions(game, ctx, ability) {
      const amount = ability.value || 1;
      game.players[ctx.casterIdx].board.forEach((m) => {
        m.health = Math.min(m.maxHealth, m.health + amount);
      });
      game._addLog(`${ctx.sourceName} heals your minions for ${amount}.`);
    },

    // Summons copies of another card (by id) onto the caster's board.
    summonMinion(game, ctx, ability) {
      const cardDef = getCardById(ability.cardId);
      if (!cardDef) {
        console.warn(`summonMinion: card "${ability.cardId}" does not exist.`);
        return;
      }
      const count = ability.count || 1;
      const p = game.players[ctx.casterIdx];
      let summoned = 0;
      for (let i = 0; i < count; i++) {
        if (boardLimitError(p, cardDef, { summoned: true })) break;
        p.board.push(makeMinionInstance(cardDef));
        summoned += 1;
      }
      if (summoned > 0) {
        game._addLog(`${ctx.sourceName} summons ${summoned} ${cardDef.name}.`);
      }
    },

    summonMinionIfMissing(game, ctx, ability) {
      const cardDef = getCardById(ability.cardId);
      if (!cardDef || cardDef.type !== "minion") return;
      const player = game.players[ctx.casterIdx];
      if (player.board.some((minion) => minion.cardId === cardDef.id)) return;
      if (boardLimitError(player, cardDef, { summoned: true })) return;
      player.board.push(makeMinionInstance(cardDef));
      game._addLog(`${ctx.sourceName} summons ${cardDef.name}.`);
    },

    // Buffs (+attack/+health) all friendly minions.
    buffAllFriendlyMinions(game, ctx, ability) {
      const atk = ability.attack || 0;
      const hp = ability.health || 0;
      game.players[ctx.casterIdx].board.forEach((m) => {
        m.attack += atk;
        m.health += hp;
        m.maxHealth += hp;
      });
      game._addLog(`${ctx.sourceName} buffs your minions (+${atk}/+${hp}).`);
    },

    buffSelf(game, ctx, ability) {
      const target = game._findMinion(ctx.instanceId);
      if (!target || target.playerIdx !== ctx.casterIdx) return;
      const atk = ability.attack || 0;
      const hp = ability.health || 0;
      target.minion.attack += atk;
      target.minion.health += hp;
      target.minion.maxHealth += hp;
      game._addLog(`${ctx.sourceName} gains +${atk}/+${hp}.`);
    },

    grantDivineShieldToAllFriendlyMinions(game, ctx, ability) {
      if (ability.firstPlayOnly && ctx.playedCount !== 1) return;
      game.players[ctx.casterIdx].board.forEach((minion) => {
        if (!minion.keywords.includes("divineShield")) minion.keywords.push("divineShield");
        minion.divineShield = true;
      });
      game._addLog(`${ctx.sourceName} grants Divine Shield to all friendly minions.`);
    },

    healSelf(game, ctx, ability) {
      const amount = ability.value || 1;
      const target = game._findMinion(ctx.instanceId);
      if (!target) return;
      target.minion.maxHealth += amount;
      target.minion.health += amount;
      game._addLog(`${ctx.sourceName} gains ${amount} health.`);
    },

    returnToDeck(game, ctx) {
      const p = game.players[ctx.casterIdx];
      p.deck.push(ctx.cardId);
      p.deck = shuffle(p.deck, game.randomInt);
      game._addLog(`${ctx.sourceName} returns to the deck.`);
    },

    returnEnemyMinionToDeck(game, ctx) {
      const target = game._findMinion(ctx.targetInstanceId);
      if (!target || target.playerIdx === ctx.casterIdx) throw new Error("Choose an enemy minion.");
      const owner = game.players[target.playerIdx];
      owner.board = owner.board.filter((minion) => minion.instanceId !== target.minion.instanceId);
      owner.deck.push(cardRefWithReturnCount(target.minion.cardId, target.minion.returnCount || 0));
      owner.deck = shuffle(owner.deck, game.randomInt);
      game._addLog(`${ctx.sourceName} returns ${target.minion.name} to the enemy deck.`);
    },

    returnAllMinionsToDeck(game, ctx) {
      let returned = 0;
      [0, 1].forEach((playerIdx) => {
        const owner = game.players[playerIdx];
        const minions = owner.board.slice();
        if (minions.length === 0) return;

        owner.board = [];
        minions.forEach((minion) => {
          owner.deck.push(cardRefWithReturnCount(minion.cardId, minion.returnCount || 0));
        });
        owner.deck = shuffle(owner.deck, game.randomInt);
        returned += minions.length;
      });
      if (returned > 0) game._addLog(`${ctx.sourceName} returns ${returned} minion(s) to their owners' decks.`);
    },

    returnOtherFriendlyMinionsToHand(game, ctx) {
      const owner = game.players[ctx.casterIdx];
      const sourceInstanceId = ctx.instanceId;
      const returning = owner.board.filter((minion) => minion.instanceId !== sourceInstanceId);
      if (returning.length === 0) return;
      if (owner.hand.length + returning.length > MAX_HAND) {
        game._addLog(`${ctx.sourceName} cannot return allies: hand is full.`);
        return;
      }

      owner.board = owner.board.filter((minion) => minion.instanceId === sourceInstanceId);
      returning.forEach((minion) => {
        owner.hand.push(cardRefWithReturnCount(minion.cardId, minion.returnCount || 0));
      });
      game._addLog(`${ctx.sourceName} returns ${returning.length} allied minion(s) to your hand.`);
    },

    rebirthWithHalfHealth(game, ctx) {
      if (ctx.rebirthUsed) return;
      const cardDef = getCardById(ctx.cardId);
      const player = game.players[ctx.casterIdx];
      if (!cardDef || cardDef.type !== "minion" || boardLimitError(player, cardDef)) return;

      const revived = makeMinionInstance(cardDef, {
        playedCount: ctx.playedCount,
        returnCount: ctx.returnCount,
        rebirthUsed: true,
      });
      revived.health = Math.ceil(revived.maxHealth / 2);
      player.board.push(revived);
      game._addLog(`${ctx.sourceName} returns with ${revived.health} Health.`);
    },

    rebirthWithHealth(game, ctx, ability) {
      if (ctx.rebirthUsed) return;
      const cardDef = getCardById(ctx.cardId);
      const player = game.players[ctx.casterIdx];
      if (!cardDef || cardDef.type !== "minion" || boardLimitError(player, cardDef)) return;

      const revived = makeMinionInstance(cardDef, {
        playedCount: ctx.playedCount,
        returnCount: ctx.returnCount,
        rebirthUsed: true,
      });
      revived.health = ability.value;
      player.board.push(revived);
      game._addLog(`${ctx.sourceName} returns with ${revived.health} Health.`);
    },

    transformIntoMinion(game, ctx, ability) {
      const cardDef = getCardById(ability.cardId);
      const player = game.players[ctx.casterIdx];
      if (!cardDef || cardDef.type !== "minion" || boardLimitError(player, cardDef)) return;

      const replacement = makeMinionInstance(cardDef);
      const boardIndex = Number.isInteger(ctx.boardIndex) ? ctx.boardIndex : player.board.length;
      player.board.splice(Math.min(Math.max(boardIndex, 0), player.board.length), 0, replacement);
      game._addLog(`${ctx.sourceName} transforms into ${cardDef.name}.`);
    },

    returnToDeckIfPlayedLessThan(game, ctx, ability) {
      const limit = ability.value || 2;
      const returnCount = ctx.returnCount || 0;
      if (returnCount >= limit - 1) return;
      const p = game.players[ctx.casterIdx];
      p.deck.push(cardRefWithReturnCount(ctx.cardId, returnCount + 1));
      p.deck = shuffle(p.deck, game.randomInt);
      game._addLog(`${ctx.sourceName} returns to the deck.`);
    },

    destroySelf(game, ctx) {
      const target = game._findMinion(ctx.instanceId);
      if (!target) return;
      game._destroyMinion(target.playerIdx, target.minion);
    },

    destroySelfIfPlayedAtLeast(game, ctx, ability) {
      const threshold = ability.value || 2;
      if ((ctx.playedCount || 0) < threshold) return;
      ABILITY_EFFECTS.destroySelf(game, ctx, ability);
    },

    applyStatus(game, ctx, ability) {
      const statusAbility = { ...ability, sourceRace: ctx.sourceRace };
      if (ctx.targetInstanceId === "faceEnemy") {
        if (!abilityCanTargetEnemyHero(ability) || ability.status !== "poisoned") {
          throw new Error("Choose an enemy minion.");
        }
        const playerIdx = game._opponentIdx(ctx.casterIdx);
        const applied = game._applyHeroStatus(playerIdx, statusAbility);
        game._addLog(`${ctx.sourceName} poisons ${game.players[playerIdx].name} for ${applied.value} damage.`);
        return;
      }
      const target = game._findMinion(ctx.targetInstanceId);
      if (!target || target.playerIdx === ctx.casterIdx || !abilityCanTargetEnemyMinion(ability)) {
        throw new Error("Choose an enemy minion.");
      }
      game._applyStatus(target.playerIdx, target.minion, statusAbility);
      game._addLog(`${ctx.sourceName} applies ${ability.status} to ${target.minion.name}.`);
    },

    applyStatusToRandomEnemyMinion(game, ctx, ability) {
      const opponentIdx = game._opponentIdx(ctx.casterIdx);
      const targets = game.players[opponentIdx].board;
      if (targets.length === 0) return;
      const target = targets[game.randomInt(targets.length)];
      const applied = game._applyStatus(opponentIdx, target, { ...ability, sourceRace: ctx.sourceRace });
      game._addLog(`${ctx.sourceName} applies ${applied.type} to ${target.name}.`);
    },

    applyBurning(game, ctx, ability) {
      const value = Math.max(1, Number.isInteger(ability.value) ? ability.value : 1);
      const turns = Math.max(1, Number.isInteger(ability.turns) ? ability.turns : 1);
      const status = { status: "burning", value, turns, sourceRace: ctx.sourceRace };
      if (ctx.targetPlayerIdx != null) {
        const applied = game._applyHeroStatus(ctx.targetPlayerIdx, status);
        game._addLog(`${ctx.sourceName} burns ${game.players[ctx.targetPlayerIdx].name} for ${applied.value} damage.`);
        return;
      }

      const target = game._findMinion(ctx.targetInstanceId);
      if (!target || target.playerIdx === ctx.casterIdx) return;
      const applied = game._applyStatus(target.playerIdx, target.minion, status);
      game._addLog(`${ctx.sourceName} burns ${target.minion.name} for ${applied.value} damage.`);
    },
  };

  class Game {
    constructor(roomCode, player1Name, player2Name, options = {}) {
      this.roomCode = roomCode;
      this.randomInt = typeof options.randomInt === "function"
        ? options.randomInt
        : (maxExclusive) => Math.floor(Math.random() * maxExclusive);
      this.players = [
        makePlayer(player1Name, options.decks?.[0], this.randomInt, options.playerConfigs?.[0]),
        makePlayer(player2Name, options.decks?.[1], this.randomInt, options.playerConfigs?.[1]),
      ];
      this.startingPlayerIdx = [0, 1].includes(options.startingPlayerIdx) ? options.startingPlayerIdx : 0;
      this.turn = this.startingPlayerIdx; // index of the active player
      this.turnNumber = 1;
      this.winner = null; // 0, 1, or null
      this.log = [];

      // Last attack action, used only by the client for animation
      // purposes (who attacked whom). Doesn't affect game rules.
      this.actionSeq = 0;
      this.lastAction = null;

      // Opening hands
      this._draw(0, START_HAND + (this.startingPlayerIdx === 1 ? 1 : 0));
      this._draw(1, START_HAND + (this.startingPlayerIdx === 0 ? 1 : 0));
      if (options.grantSecondPlayerManaCard === true) {
        const secondPlayerIdx = this._opponentIdx(this.startingPlayerIdx);
        this.players[secondPlayerIdx].hand.push(SECOND_PLAYER_MANA_CARD_ID);
        this._addLog(`${this.players[secondPlayerIdx].name} receives a Mana Spark for going second.`);
      }
      this._startTurn(this.startingPlayerIdx);
    }

    _addLog(msg) {
      this.log.push(msg);
      if (this.log.length > 100) this.log.shift();
    }

    _recordAction(action) {
      this.actionSeq += 1;
      this.lastAction = { ...action, seq: this.actionSeq };
    }

    _draw(playerIdx, n = 1) {
      const p = this.players[playerIdx];
      for (let i = 0; i < n; i++) {
        if (p.deck.length === 0) {
          this._addLog(`${p.name}'s deck is empty — no card drawn.`);
          continue;
        }
        if (p.hand.length >= MAX_HAND) {
          p.deck.shift();
          this._addLog(`${p.name} burns a card (hand is full).`);
          continue;
        }
        const cardId = p.deck.shift();
        p.hand.push(cardId);
      }
    }

    _startTurn(playerIdx) {
      const p = this.players[playerIdx];
      p.manaMax = Math.min(p.manaCap || MAX_MANA, p.manaMax + 1);
      p.manaCurrent = p.manaMax;
      this._resolveStartOfTurnHeroStatuses(playerIdx);
      [...p.board].forEach((m) => this._resolveStartOfTurnStatuses(playerIdx, m));
      p.board.forEach((m) => {
        m.canAttack = !this._hasStatus(m, "frozen");
      });
      this._draw(playerIdx, 1);
      this.turn = playerIdx;
      this._addLog(`--- ${p.name}'s turn (#${this.turnNumber}) ---`);

      // Fire "start of turn" abilities for every minion this player
      // controls. Iterate over a COPY of the board: an ability (like
      // summonMinion, or a damage effect) can add or remove minions
      // while we're going through the list.
      [...p.board].forEach((m) => {
        const cardDef = getCardById(m.cardId);
        if (cardDef) {
          this._triggerAbilities(cardDef, "onTurnStart", {
            casterIdx: playerIdx,
            sourceName: m.name,
            instanceId: m.instanceId,
            cardId: m.cardId,
            playedCount: m.playedCount || 0,
            returnCount: m.returnCount || 0,
            silenced: this._hasStatus(m, "silenced"),
          });
        }
      });

      [0, 1].forEach((ownerIdx) => {
        [...this.players[ownerIdx].board].forEach((m) => {
          const cardDef = getCardById(m.cardId);
          if (cardDef) {
            this._triggerAbilities(cardDef, "onAnyTurnStart", {
              casterIdx: ownerIdx,
              sourceName: m.name,
              instanceId: m.instanceId,
              cardId: m.cardId,
              playedCount: m.playedCount || 0,
              silenced: this._hasStatus(m, "silenced"),
            });
          }
        });
      });
      this._checkWin();
    }

    _checkWin() {
      if (this.winner !== null) return;
      if (this.players[0].health <= 0 && this.players[1].health <= 0) {
        this.winner = "draw";
      } else if (this.players[0].health <= 0) {
        this.winner = 1;
      } else if (this.players[1].health <= 0) {
        this.winner = 0;
      } else if (this.players.every((player) => player.hand.length === 0 && player.deck.length === 0 && player.board.length === 0)) {
        this.winner = "draw";
        this._addLog("Both duelists have exhausted every card. The match ends in a draw.");
      }
    }

    applyHeroDamage(playerIdx, amount, sourceName = "") {
      if (!Number.isInteger(playerIdx) || !this.players[playerIdx]) throw new Error("Invalid player.");
      if (!Number.isInteger(amount) || amount < 1) throw new Error("Invalid damage.");
      this.players[playerIdx].health -= amount;
      if (sourceName) this._addLog(`${sourceName} deals ${amount} damage to ${this.players[playerIdx].name}.`);
      this._checkWin();
    }

    _opponentIdx(playerIdx) {
      return playerIdx === 0 ? 1 : 0;
    }

    // Fires a card's abilities for a given trigger ("onPlay", "onDeath").
    // If a card has no "abilities" or none match the trigger, this is a
    // no-op — 99% of cards (all the base ones, for example) pass through
    // here with no effect.
    _triggerAbilities(cardDef, trigger, ctx) {
      if (ctx.silenced) return;
      ctx.sourceRace = ctx.sourceRace || cardDef.race || null;
      const abilities = (cardDef.abilities || []).filter((a) => a.trigger === trigger);
      abilities.forEach((ability) => {
        if (ability.firstDeathOnly && ctx.rebirthUsed) return;
        const handler = ABILITY_EFFECTS[ability.effect];
        if (!handler) {
          console.warn(`Unknown ability "${ability.effect}" on "${cardDef.name}" (${trigger}) — skipping.`);
          return;
        }
        handler(this, ctx, ability);
        this._checkWin();
      });
    }

    // ---------------- PLAYER ACTIONS ----------------

    playCard(playerIdx, handIndex, targetInstanceId = null) {
      this._assertActive(playerIdx);
      const p = this.players[playerIdx];
      const cardRef = p.hand[handIndex];
      const cardId = cardIdFromRef(cardRef);
      const returnCount = returnCountFromRef(cardRef);
      if (!cardRef) throw new Error("Invalid card.");
      const card = getCardById(cardId);
      if (!card) throw new Error("Unknown card.");
      if (card.cost > p.manaCurrent) throw new Error("Not enough mana.");
      this._validateAbilityTargets(playerIdx, card, targetInstanceId);

      if (card.type === "minion") {
        const isolatesFriendlyBoard = cardReturnsOtherFriendlyMinionsToHand(card);
        const limitError = boardLimitError(p, card, {
          ignoreBoardLimit: isolatesFriendlyBoard,
          ignoreKeywordLimits: isolatesFriendlyBoard,
        });
        if (limitError) throw new Error(limitError);
        p.manaCurrent -= card.cost;
        p.hand.splice(handIndex, 1);
        const playedCount = (p.playedCounts[card.id] || 0) + 1;
        p.playedCounts[card.id] = playedCount;
        const minion = makeMinionInstance(card, { playedCount, returnCount });
        p.board.push(minion);
        this._addLog(`${p.name} plays ${card.name}.`);
        this._triggerAbilities(card, "onPlay", {
          casterIdx: playerIdx,
          sourceName: card.name,
          instanceId: minion.instanceId,
          cardId: card.id,
          playedCount,
          returnCount,
          targetInstanceId,
        });
      } else if (card.type === "spell") {
        p.manaCurrent -= card.cost;
        p.hand.splice(handIndex, 1);
        if (card.effect) {
          this._resolveSpell(playerIdx, card, targetInstanceId);
        }
        this._addLog(`${p.name} casts ${card.name}.`);
        this._triggerAbilities(card, "onPlay", {
          casterIdx: playerIdx,
          sourceName: card.name,
          targetInstanceId,
        });
      }
      this._checkWin();
    }

    _resolveSpell(casterIdx, card, targetInstanceId) {
      const caster = this.players[casterIdx];
      const opp = this.players[this._opponentIdx(casterIdx)];

      if (card.effect === "draw") {
        this._draw(casterIdx, card.value);
        return;
      }
      if (card.effect === "heal") {
        // Heroes are capped at maximum Health. Minions retain healing overflow.
        // Clicking the caster's hero explicitly uses faceSelf in the client.
        if (!targetInstanceId || targetInstanceId === "faceSelf") {
          applyHeroHeal(caster, card.value);
          return;
        }
        if (targetInstanceId === "faceEnemy") {
          throw new Error("Choose your own hero or a minion to heal.");
        }
        const target = this._findMinion(targetInstanceId);
        if (!target) throw new Error("Invalid target.");
        applyOverflowHeal(target.minion, card.value);
        return;
      }
      if (card.effect === "damage") {
        if (!targetInstanceId || targetInstanceId === "faceEnemy") {
          opp.health -= card.value;
          return;
        }
        if (targetInstanceId === "faceSelf") {
          caster.health -= card.value;
          return;
        }
        const target = this._findMinion(targetInstanceId);
        if (!target) throw new Error("Invalid target.");
        this._damageMinion(target.playerIdx, target.minion, card.value, { sourceRace: card.race });
      }
    }

    _findMinion(instanceId) {
      for (let pi = 0; pi < 2; pi++) {
        const minion = this.players[pi].board.find((m) => m.instanceId === instanceId);
        if (minion) return { playerIdx: pi, minion };
      }
      return null;
    }

    getBoardLimitError(playerIdx, cardDef, options = {}) {
      if (!Number.isInteger(playerIdx) || !this.players[playerIdx]) return "Invalid player.";
      if (!cardDef || cardDef.type !== "minion") return null;
      return boardLimitError(this.players[playerIdx], cardDef, options);
    }

    _validateAbilityTargets(playerIdx, card, targetInstanceId) {
      const needsHandSpace = (card.abilities || []).some((ability) => ability.effect === "stealRandomEnemyDeckCardToHand");
      if (needsHandSpace && this.players[playerIdx].hand.length >= MAX_HAND) {
        throw new Error("Your hand is full.");
      }
      const returnsFriendlyBoardToHand = (card.abilities || []).some((ability) => ability.effect === "returnOtherFriendlyMinionsToHand");
      if (returnsFriendlyBoardToHand) {
        const player = this.players[playerIdx];
        const availableAfterPlay = MAX_HAND - Math.max(0, player.hand.length - 1);
        if (player.board.length > availableAfterPlay) {
          throw new Error("Not enough hand space.");
        }
      }
      if (card.type === "spell" && ["damage", "heal"].includes(card.effect)) {
        if (card.effect === "heal" && targetInstanceId === "faceEnemy") {
          throw new Error("Choose your own hero or a minion to heal.");
        }
        const isHeroTarget = targetInstanceId === "faceSelf" || targetInstanceId === "faceEnemy";
        if (targetInstanceId && !isHeroTarget && !this._findMinion(targetInstanceId)) {
          throw new Error("Invalid target.");
        }
      }
      for (const ability of card.abilities || []) {
        if (ability.trigger !== "onPlay") continue;

        if (ability.effect === "returnEnemyMinionToDeck") {
          const target = this._findMinion(targetInstanceId);
          if (!target || target.playerIdx === playerIdx) {
            throw new Error("Choose an enemy minion.");
          }
        }

        if (ability.effect === "applyStatus") {
          if (ability.target === "enemyHero") {
            if (targetInstanceId !== "faceEnemy") throw new Error("Choose the enemy hero.");
            if (ability.status !== "poisoned") throw new Error("Invalid hero status.");
            continue;
          }

          const canTargetHero = abilityCanTargetEnemyHero(ability) && ability.status === "poisoned";
          if (targetInstanceId === "faceEnemy") {
            if (!canTargetHero) throw new Error("Choose an enemy minion.");
            continue;
          }

          const target = this._findMinion(targetInstanceId);
          if (!target || target.playerIdx === playerIdx || !abilityCanTargetEnemyMinion(ability)) {
            throw new Error("Choose an enemy minion.");
          }
        }
      }
    }

    _damageMinion(ownerIdx, minion, amount, options = {}) {
      if (amount > 0 && minionPreventsDamageFromRace(minion, options.sourceRace)) {
        this._addLog(`${minion.name} takes no damage from ${options.sourceRace} cards.`);
        return;
      }
      if (minion.divineShield && amount > 0) {
        minion.divineShield = false;
        return;
      }
      const marked = amount > 0 ? this._takeStatus(minion, "marked") : null;
      if (marked) amount += marked.value || 1;
      minion.health -= amount;
      if (minion.health <= 0) {
        this._destroyMinion(ownerIdx, minion);
      }
    }

    _destroyMinion(ownerIdx, minion) {
      const p = this.players[ownerIdx];
      const boardIndex = p.board.findIndex((card) => card.instanceId === minion.instanceId);
      if (boardIndex < 0) return;
      p.board.splice(boardIndex, 1);
      this._addLog(`${minion.name} dies.`);
      const cardDef = getCardById(minion.cardId);
      if (cardDef) {
        this._triggerAbilities(cardDef, "onDeath", {
          casterIdx: ownerIdx,
          sourceName: minion.name,
          instanceId: minion.instanceId,
          cardId: minion.cardId,
          playedCount: minion.playedCount || 0,
          returnCount: minion.returnCount || 0,
          rebirthUsed: minion.rebirthUsed === true,
          boardIndex,
          silenced: this._hasStatus(minion, "silenced"),
        });
      }
      this._reviveWithFriendlyAuras(ownerIdx, minion, boardIndex);
    }

    _reviveWithFriendlyAuras(ownerIdx, minion, boardIndex) {
      const player = this.players[ownerIdx];
      const cardDef = getCardById(minion.cardId);
      if (!cardDef || cardDef.type !== "minion") return;
      if ((cardDef.abilities || []).some((ability) => ability.effect === "reviveOtherFriendlyMinions")) return;
      if (minionHasTaunt(minion, cardDef)) return;
      if (minion.friendlyReviveUsed === true) return;

      const aura = player.board.find((ally) =>
        ally.instanceId !== minion.instanceId && minionRevivesOtherFriendlyMinions(ally)
      );
      if (!aura) return;
      if (boardLimitError(player, cardDef)) return;

      const revived = makeMinionInstance(cardDef, {
        playedCount: minion.playedCount || 0,
        returnCount: minion.returnCount || 0,
        rebirthUsed: minion.rebirthUsed === true,
      });
      revived.attack = Math.max(0, Math.ceil((minion.attack || 0) / 2));
      revived.health = 1;
      revived.maxHealth = 1;
      revived.canAttack = false;
      revived.friendlyReviveUsed = true;

      const insertAt = Math.min(Math.max(boardIndex, 0), player.board.length);
      player.board.splice(insertAt, 0, revived);
      this._addLog(`${aura.name} revives ${revived.name} with 1 Health and ${revived.attack} Attack.`);
    }

    _hasStatus(minion, type) {
      return (minion.statuses || []).some((status) => status.type === type);
    }

    _takeStatus(minion, type) {
      const statuses = minion.statuses || [];
      const index = statuses.findIndex((status) => status.type === type);
      if (index < 0) return null;
      return statuses.splice(index, 1)[0];
    }

    _applyStatus(ownerIdx, minion, ability) {
      const type = ability.status;
      if (!STATUS_TYPES.has(type)) throw new Error("Invalid status.");
      minion.statuses = minion.statuses || [];
      if (type === "burning") return this._applyBurningStatus(minion.statuses, ability);

      const existing = this._takeStatus(minion, type);
      if (existing?.type === "weakened") minion.attack += existing.appliedValue || 0;

      const value = Math.max(1, Number.isInteger(ability.value) ? ability.value : 1);
      const turns = Math.max(1, Number.isInteger(ability.turns) ? ability.turns : type === "poisoned" || type === "marked" ? 2 : 1);
      const status = { type, value, turnsRemaining: type === "silenced" ? null : turns };
      setStatusSourceRace(status, ability.sourceRace);

      if (type === "weakened") {
        status.appliedValue = Math.min(value, minion.attack);
        minion.attack -= status.appliedValue;
      }
      if (type === "frozen") minion.canAttack = false;
      if (type === "silenced") {
        minion.keywords = [];
        minion.divineShield = false;
      }
      minion.statuses.push(status);
      return status;
    }

    _applyHeroStatus(playerIdx, ability) {
      const type = ability.status;
      if (type !== "burning" && type !== "poisoned") throw new Error("Invalid hero status.");
      const player = this.players[playerIdx];
      if (!player) throw new Error("Invalid player.");
      player.statuses = player.statuses || [];
      if (type === "burning") return this._applyBurningStatus(player.statuses, ability);

      const existingIndex = player.statuses.findIndex((status) => status.type === type);
      if (existingIndex >= 0) player.statuses.splice(existingIndex, 1);
      const value = Math.max(1, Number.isInteger(ability.value) ? ability.value : 1);
      const turns = Math.max(1, Number.isInteger(ability.turns) ? ability.turns : 2);
      const status = { type, value, turnsRemaining: turns };
      setStatusSourceRace(status, ability.sourceRace);
      player.statuses.push(status);
      return status;
    }

    _applyBurningStatus(statuses, ability) {
      const value = Math.max(1, Number.isInteger(ability.value) ? ability.value : 1);
      const turns = Math.max(1, Number.isInteger(ability.turns) ? ability.turns : 1);
      const index = statuses.findIndex((status) => status.type === "burning");
      const existing = index >= 0 ? statuses.splice(index, 1)[0] : null;
      const status = {
        type: "burning",
        value: (existing?.value || 0) + value,
        turnsRemaining: (existing?.turnsRemaining || 0) + turns,
      };
      setStatusSourceRace(status, ability.sourceRace || existing?.sourceRace);
      statuses.push(status);
      return status;
    }

    _resolveStartOfTurnStatuses(ownerIdx, minion) {
      const poison = (minion.statuses || []).find((status) => status.type === "poisoned");
      if (poison) this._damageMinion(ownerIdx, minion, poison.value || 1, { sourceRace: poison.sourceRace });
      if (!this.players[ownerIdx].board.some((card) => card.instanceId === minion.instanceId)) return;
      const burning = (minion.statuses || []).find((status) => status.type === "burning");
      if (burning) {
        this._damageMinion(ownerIdx, minion, burning.value || 1, { sourceRace: burning.sourceRace });
        this._addLog(`${minion.name} takes ${burning.value || 1} Burning damage.`);
      }
    }

    _resolveStartOfTurnHeroStatuses(playerIdx) {
      const poison = (this.players[playerIdx].statuses || []).find((status) => status.type === "poisoned");
      if (poison) this.applyHeroDamage(playerIdx, poison.value || 1, "Poisoned");
      if (this.winner !== null) return;
      const burning = (this.players[playerIdx].statuses || []).find((status) => status.type === "burning");
      if (!burning) return;
      this.applyHeroDamage(playerIdx, burning.value || 1, "Burning");
    }

    _expireStatusesAtTurnEnd(playerIdx) {
      this.players[playerIdx].statuses = (this.players[playerIdx].statuses || []).filter((status) => {
        if (status.turnsRemaining == null) return true;
        status.turnsRemaining -= 1;
        return status.turnsRemaining > 0;
      });
      this.players[playerIdx].board.forEach((minion) => {
        minion.statuses = (minion.statuses || []).filter((status) => {
          if (status.turnsRemaining == null) return true;
          status.turnsRemaining -= 1;
          if (status.turnsRemaining > 0) return true;
          if (status.type === "weakened") minion.attack += status.appliedValue || 0;
          return false;
        });
      });
    }

    _attackDamageAgainst(attacker, target) {
      const cardDef = getCardById(attacker.cardId);
      const bonuses = cardDef?.damageBonuses || [];
      const extra = bonuses.reduce((sum, bonus) => {
        const targetRace = String(target.race || "").toLowerCase();
        const bonusRace = String(bonus.race || "").toLowerCase();
        return targetRace === bonusRace ? sum + (bonus.value || 0) : sum;
      }, 0);
      return attacker.attack + extra;
    }

    _isDrunkAuraActive() {
      return this.players.some((player) => player.board.some((minion) => minionAppliesDrunkAura(minion)));
    }

    _randomDrunkTarget(attackerInstanceId) {
      const candidates = [];
      this.players.forEach((player, playerIdx) => {
        player.board.forEach((minion) => {
          if (minion.instanceId !== attackerInstanceId) candidates.push({ playerIdx, minion });
        });
      });
      if (candidates.length === 0) return null;
      return candidates[this.randomInt(candidates.length)];
    }

    attack(playerIdx, attackerInstanceId, targetInstanceId /* or "face" */) {
      this._assertActive(playerIdx);
      const p = this.players[playerIdx];
      const opp = this.players[this._opponentIdx(playerIdx)];
      const attacker = p.board.find((m) => m.instanceId === attackerInstanceId);
      if (!attacker) throw new Error("Invalid attacker.");
      if (!attacker.canAttack) throw new Error("That minion can't attack yet.");

      if (this._isDrunkAuraActive()) {
        const target = this._randomDrunkTarget(attacker.instanceId);
        if (!target) throw new Error("No Drunk target available.");
        const attackDamage = this._attackDamageAgainst(attacker, target.minion);
        this._damageMinion(target.playerIdx, target.minion, attackDamage, { sourceRace: attacker.race });
        this._damageMinion(playerIdx, attacker, target.minion.attack, { sourceRace: target.minion.race });
        attacker.canAttack = false;
        this._addLog(`${attacker.name} drunkenly attacks ${target.minion.name}.`);
        this._recordAction({ type: "attack", attackerInstanceId, targetInstanceId: target.minion.instanceId, isFace: false, randomTarget: true });
        const attackerCard = getCardById(attacker.cardId);
        if (attackerCard) {
          this._triggerAbilities(attackerCard, "onAttack", {
            casterIdx: playerIdx,
            sourceName: attacker.name,
            instanceId: attacker.instanceId,
            cardId: attacker.cardId,
            playedCount: attacker.playedCount || 0,
            targetInstanceId: target.minion.instanceId,
            targetPlayerIdx: null,
            targetRace: target.minion.race,
            silenced: this._hasStatus(attacker, "silenced"),
          });
          this._triggerAbilities(attackerCard, "onAttackMinion", {
            casterIdx: playerIdx,
            sourceName: attacker.name,
            instanceId: attacker.instanceId,
            cardId: attacker.cardId,
            playedCount: attacker.playedCount || 0,
            targetInstanceId: target.minion.instanceId,
            targetPlayerIdx: null,
            targetRace: target.minion.race,
            silenced: this._hasStatus(attacker, "silenced"),
          });
        }
        this._checkWin();
        return;
      }

      const tauntMinions = opp.board.filter((m) => m.keywords.includes("taunt"));

      if (targetInstanceId === "face") {
        if (tauntMinions.length > 0) throw new Error("There's a Taunt minion in the way: you must attack it first.");
        opp.health -= attacker.attack;
        attacker.canAttack = false;
        this._addLog(`${attacker.name} attacks directly for ${attacker.attack}.`);
        this._recordAction({ type: "attack", attackerInstanceId, targetInstanceId: null, isFace: true });
        const attackerCard = getCardById(attacker.cardId);
        if (attackerCard) {
          this._triggerAbilities(attackerCard, "onAttack", {
            casterIdx: playerIdx,
            sourceName: attacker.name,
            instanceId: attacker.instanceId,
            cardId: attacker.cardId,
            playedCount: attacker.playedCount || 0,
            targetPlayerIdx: this._opponentIdx(playerIdx),
            silenced: this._hasStatus(attacker, "silenced"),
          });
        }
        this._checkWin();
        return;
      }

      const target = opp.board.find((m) => m.instanceId === targetInstanceId);
      if (!target) throw new Error("Invalid target.");
      if (tauntMinions.length > 0 && !target.keywords.includes("taunt")) {
        throw new Error("There's a Taunt minion in the way: you must attack it first.");
      }

      // Mutual combat
      const attackDamage = this._attackDamageAgainst(attacker, target);
      this._damageMinion(this._opponentIdx(playerIdx), target, attackDamage, { sourceRace: attacker.race });
      this._damageMinion(playerIdx, attacker, target.attack, { sourceRace: target.race });
      attacker.canAttack = false;
      this._addLog(`${attacker.name} fights ${target.name}.`);
      const attackerCard = getCardById(attacker.cardId);
      if (attackerCard) {
        this._triggerAbilities(attackerCard, "onAttack", {
          casterIdx: playerIdx,
          sourceName: attacker.name,
          instanceId: attacker.instanceId,
          cardId: attacker.cardId,
          playedCount: attacker.playedCount || 0,
          targetInstanceId: target.instanceId,
          targetPlayerIdx: null,
          targetRace: target.race,
          silenced: this._hasStatus(attacker, "silenced"),
        });
        this._triggerAbilities(attackerCard, "onAttackMinion", {
          casterIdx: playerIdx,
          sourceName: attacker.name,
          instanceId: attacker.instanceId,
          cardId: attacker.cardId,
          playedCount: attacker.playedCount || 0,
          targetInstanceId: target.instanceId,
          targetPlayerIdx: null,
          targetRace: target.race,
          silenced: this._hasStatus(attacker, "silenced"),
        });
      }
      this._recordAction({ type: "attack", attackerInstanceId, targetInstanceId, isFace: false });
      this._checkWin();
    }

    endTurn(playerIdx) {
      this._assertActive(playerIdx);
      const next = this._opponentIdx(playerIdx);
      // turnNumber is the shared round counter: A plays round 1, then B
      // plays round 1. It advances only as control returns to the starter.
      if (next === this.startingPlayerIdx) this.turnNumber += 1;
      this._expireStatusesAtTurnEnd(playerIdx);
      this._startTurn(next);
    }

    // Conceding works regardless of whose turn it is — only blocked if
    // the match is already over.
    surrender(playerIdx) {
      if (this.winner !== null) throw new Error("The match has already ended.");
      this._addLog(`${this.players[playerIdx].name} surrenders.`);
      this.winner = this._opponentIdx(playerIdx);
    }

    _assertActive(playerIdx) {
      if (this.winner !== null) throw new Error("The match has already ended.");
      if (this.turn !== playerIdx) throw new Error("It's not your turn.");
    }

    // ---------------- PER-PLAYER VIEW ----------------
    // Hides the opponent's hand and deck contents.

    getStateFor(viewerIdx) {
      const oppIdx = this._opponentIdx(viewerIdx);
      const me = this.players[viewerIdx];
      const opp = this.players[oppIdx];
      const drunkAuraActive = this._isDrunkAuraActive();

      const serializeBoard = (board) =>
        board.map((m) => ({
          instanceId: m.instanceId,
          cardId: m.cardId,
          name: m.name,
          attack: m.attack,
          health: m.health,
          maxHealth: m.maxHealth,
          keywords: m.keywords,
          canAttack: m.canAttack,
          divineShield: m.divineShield,
          statuses: [
            ...(m.statuses || []).map((status) => ({
              type: status.type,
              value: status.value,
              turnsRemaining: status.turnsRemaining,
            })),
            ...(drunkAuraActive && !(m.statuses || []).some((status) => status.type === "drunk") ? [{ type: "drunk" }] : []),
          ],
          race: m.race,
          rarity: m.rarity,
          country: m.country,
          lore: m.lore,
          image: m.image,
          returnCount: m.returnCount || 0,
        }));

      return {
        roomCode: this.roomCode,
        you: viewerIdx,
        turn: this.turn,
        turnNumber: this.turnNumber,
        isYourTurn: this.turn === viewerIdx,
        winner: this.winner,
        log: this.log.slice(-15),
        lastAction: this.lastAction,
        me: {
          name: me.name,
          health: me.health,
          maxHealth: me.maxHealth,
          statuses: (me.statuses || []).map((status) => ({
            type: status.type,
            value: status.value,
            turnsRemaining: status.turnsRemaining,
          })),
          manaMax: me.manaMax,
          manaCurrent: me.manaCurrent,
          deckCount: me.deck.length,
          hand: me.hand.map((cardRef) => getCardById(cardIdFromRef(cardRef))),
          board: serializeBoard(me.board),
        },
        opponent: {
          name: opp.name,
          health: opp.health,
          maxHealth: opp.maxHealth,
          statuses: (opp.statuses || []).map((status) => ({
            type: status.type,
            value: status.value,
            turnsRemaining: status.turnsRemaining,
          })),
          manaMax: opp.manaMax,
          manaCurrent: opp.manaCurrent,
          deckCount: opp.deck.length,
          handCount: opp.hand.length,
          board: serializeBoard(opp.board),
        },
      };
    }
  }

  return { Game };
});
