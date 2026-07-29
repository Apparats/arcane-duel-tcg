// ============================================================
// BOARD INTERACTIONS - Pointer-event gestures for hand-to-board
// plays and minion attack targeting. Rules remain server-authoritative.
// ============================================================

(() => {
  const board = document.querySelector(".board");
  const arrow = document.getElementById("targetingArrow");
  const arrowPath = document.getElementById("targetingArrowPath");
  if (!board || !arrow || !arrowPath) return;

  const MOVE_THRESHOLD = 14;
  let drag = null;
  let suppressNextClick = false;
  let suppressedDragSource = null;
  let clearSuppressedClickTimer = null;

  function closest(target, selector) {
    return target && target.nodeType === Node.ELEMENT_NODE ? target.closest(selector) : null;
  }

  function clearArrow() {
    arrowPath.setAttribute("d", "");
  }

  function clearSuppressedClick() {
    suppressNextClick = false;
    suppressedDragSource = null;
    clearTimeout(clearSuppressedClickTimer);
  }

  function suppressDragClick(source) {
    suppressNextClick = true;
    suppressedDragSource = source;
    clearTimeout(clearSuppressedClickTimer);
    // Some touch browsers do not emit a click after a captured drag. Expire
    // the guard, while matching the source below keeps other controls live.
    clearSuppressedClickTimer = setTimeout(() => {
      clearSuppressedClick();
    }, 500);
  }

  function clearDrag() {
    if (drag?.source) {
      drag.source.classList.remove("card-dragging", "card-dragging-hand", "card-dragging-attack");
      delete drag.source.dataset.dragArmed;
      drag.source.style.pointerEvents = "";
      if (drag.type === "hand" || drag.type === "targeted-spell") drag.source.style.transform = "";
    }
    drag = null;
    clearArrow();
  }

  function notifySpellDrag(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function startDrag(event, source, type, payload) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // A hover tilt may still be applied when the pointer goes down. Clear it
    // before the drag takes ownership of the card transform.
    source.style.transform = "";
    source.style.zIndex = "";
    const art = source.querySelector(".card-art");
    if (art) art.style.transform = "";
    const sourceRect = source.getBoundingClientRect();
    drag = {
      source,
      type,
      payload,
      startX: event.clientX,
      startY: event.clientY,
      arrowStart: {
        x: sourceRect.left + sourceRect.width / 2,
        y: sourceRect.top + sourceRect.height / 2,
      },
      moved: false,
    };
    source.dataset.dragArmed = "true";
    source.setPointerCapture?.(event.pointerId);
  }

  function moveHandCard(clientX, clientY) {
    if (!drag?.source) return;
    // Keep the dragged card from masking the hero or minion beneath it at
    // drop time. Pointer capture continues to deliver the gesture safely.
    drag.source.style.pointerEvents = "none";
    const handRestY = drag.source.style.getPropertyValue("--hand-rest-y") || "0px";
    const handAngle = drag.source.style.getPropertyValue("--hand-angle") || "0deg";
    const offsetX = clientX - drag.startX;
    const offsetY = clientY - drag.startY;
    drag.source.style.transform = `translate(${offsetX}px, ${offsetY}px) translateY(${handRestY}) rotate(${handAngle}) scale(1.06)`;
  }

  function drawArrow(clientX, clientY) {
    if (!drag || (drag.type !== "attack" && drag.type !== "targeted-spell")) return;
    const boardRect = board.getBoundingClientRect();
    arrow.setAttribute("viewBox", `0 0 ${boardRect.width} ${boardRect.height}`);
    const startX = drag.arrowStart.x - boardRect.left;
    const startY = drag.arrowStart.y - boardRect.top;
    const endX = clientX - boardRect.left;
    const endY = clientY - boardRect.top;
    const controlX = startX + (endX - startX) * 0.5;
    const controlY = startY + (endY - startY) * 0.5 - 42;
    arrowPath.setAttribute("d", `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`);
  }

  function targetFromPoint(clientX, clientY) {
    const target = document.elementFromPoint(clientX, clientY);
    const minion = closest(target, ".minion-card");
    if (minion?.dataset.instanceId) return { minion, id: minion.dataset.instanceId };
    const hero = closest(target, ".hero-panel");
    if (hero?.id === "oppHero") return { hero, id: "face" };
    if (hero?.id === "selfHero") return { hero, id: "self" };
    return null;
  }

  function spellTargetId(target) {
    // Drag targeting uses compact board-local ids for attacks. Spell intents
    // use the authoritative engine ids for hero targets instead.
    if (target.id === "self") return "faceSelf";
    if (target.id === "face") return "faceEnemy";
    return target.id;
  }

  function finishAttack(clientX, clientY) {
    const target = targetFromPoint(clientX, clientY);
    if (!target || target.id === "self") return false;
    window.ArcaneAudio?.playSfx("attack");
    predictAttack(drag.payload.instanceId, target.id);
    send("attack", { attackerInstanceId: drag.payload.instanceId, targetInstanceId: target.id });
    selectedAttackerId = null;
    return true;
  }

  function finishHandDrag(clientX, clientY) {
    const { card, handIndex } = drag.payload;
    const elementAtDrop = document.elementFromPoint(clientX, clientY);
    // Returning a dragged card to the hand is always a cancellation. It must
    // happen before board targeting, because a released pointer also emits a
    // click and the normal click-to-play path would otherwise fire.
    if (closest(elementAtDrop, "#handArea")) {
      // Returning a selected spell to the hand is also a cancellation. This
      // matters on touch devices, where the cancel link is easy to miss.
      if (selectedHandIndex === handIndex) {
        clearSelection();
        render(myState);
      }
      return false;
    }
    const target = targetFromPoint(clientX, clientY);
    const overSelfBoard = Boolean(closest(elementAtDrop, "#selfBoard"));

    const needsPlayTarget = typeof cardRequiresPlayTarget === "function" && cardRequiresPlayTarget(card);
    const needsEnemyMinionTarget = typeof cardRequiresEnemyMinionTarget === "function" && cardRequiresEnemyMinionTarget(card);
    const needsFriendlyMinionTarget = typeof cardRequiresFriendlyMinionTarget === "function" && cardRequiresFriendlyMinionTarget(card);
    const needsMinionTarget = typeof cardRequiresMinionTarget === "function" && cardRequiresMinionTarget(card);
    const needsEnemyHeroTarget = typeof cardRequiresEnemyHeroTarget === "function" && cardRequiresEnemyHeroTarget(card);
    const enemyOnlyTarget = typeof cardTargetsEnemyOnly === "function" && cardTargetsEnemyOnly(card);
    const optionalEnemyMinionTarget = typeof cardHasOptionalEnemyMinionPlayTarget === "function" && cardHasOptionalEnemyMinionPlayTarget(card);
    const hasEnemyMinionTarget = (myState?.opponent?.board || []).length > 0;
    if (card.type === "minion" && needsEnemyMinionTarget && optionalEnemyMinionTarget && !hasEnemyMinionTarget) {
      if (!overSelfBoard) return false;
      window.ArcaneAudio?.playSfx("cardPlay");
      pendingHandPlayAnimation = { cardId: card.id, rect: drag.source.getBoundingClientRect(), createdAt: performance.now() };
      predictCardPlay(drag.source);
      send("playCard", { handIndex, targetInstanceId: null });
      return true;
    }

    if (needsPlayTarget && needsMinionTarget) {
      if (!target?.minion) return false;
      window.ArcaneAudio?.playSfx("cardPlay");
      predictCardPlay(drag.source);
      send("playCard", { handIndex, targetInstanceId: target.id });
      selectedHandIndex = null;
      hideTargetHint();
      return true;
    }
    if (needsPlayTarget && needsFriendlyMinionTarget) {
      if (!target) return false;
      const isFriendlyMinion = target?.minion?.parentElement?.id === "selfBoard";
      if (!isFriendlyMinion) return false;
      window.ArcaneAudio?.playSfx("cardPlay");
      predictCardPlay(drag.source);
      send("playCard", { handIndex, targetInstanceId: spellTargetId(target) });
      selectedHandIndex = null;
      hideTargetHint();
      return true;
    }
    if (needsPlayTarget && enemyOnlyTarget) {
      if (!target) return false;
      const isEnemyMinion = target?.minion?.parentElement?.id === "oppBoard";
      const isEnemyHero = target?.id === "face";
      if (needsEnemyMinionTarget && !isEnemyMinion) return false;
      if (needsEnemyHeroTarget && !isEnemyHero) return false;
      if (!isEnemyMinion && !isEnemyHero) return false;
      window.ArcaneAudio?.playSfx("cardPlay");
      predictCardPlay(drag.source);
      send("playCard", { handIndex, targetInstanceId: spellTargetId(target) });
      selectedHandIndex = null;
      hideTargetHint();
      return true;
    }

    if (card.type === "minion") {
      if (!overSelfBoard) return false;
      window.ArcaneAudio?.playSfx("cardPlay");
      pendingHandPlayAnimation = { cardId: card.id, rect: drag.source.getBoundingClientRect(), createdAt: performance.now() };
      predictCardPlay(drag.source);
      send("playCard", { handIndex, targetInstanceId: null });
      return true;
    }

    if (card.effect === "draw" || !card.effect) {
      if (!overSelfBoard) return false;
      window.ArcaneAudio?.playSfx("cardPlay");
      predictCardPlay(drag.source);
      send("playCard", { handIndex, targetInstanceId: null });
      return true;
    }

    if (!target) return false;
    const healTarget = target.id === "self" || target.minion?.parentElement?.id === "selfBoard";
    if (card.effect === "heal" ? !healTarget : healTarget) return false;
    window.ArcaneAudio?.playSfx("cardPlay");
    predictCardPlay(drag.source);
    send("playCard", { handIndex, targetInstanceId: spellTargetId(target) });
    selectedHandIndex = null;
    hideTargetHint();
    return true;
  }

  board.addEventListener("pointerdown", (event) => {
    // A new gesture must never inherit the cancelled-drag click guard.
    clearSuppressedClick();
    const handCard = closest(event.target, ".hand-card");
    if (handCard) {
      const handIndex = Number(handCard.dataset.handIndex);
      const card = myState?.me?.hand?.[handIndex];
      if (!myState?.isYourTurn || !card || card.cost > myState.me.manaCurrent) return;
      if (typeof getHandCardPlayBlockReason === "function" && getHandCardPlayBlockReason(myState, card)) return;
      const needsPlayTarget = typeof cardRequiresPlayTarget === "function" && cardRequiresPlayTarget(card);
      const targetedCard = needsPlayTarget || (card.type === "spell" && card.effect && card.effect !== "draw");
      startDrag(event, handCard, targetedCard ? "targeted-spell" : "hand", { card, handIndex });
      return;
    }

    const minionCard = closest(event.target, "#selfBoard .minion-card");
    if (!minionCard) return;
    const instanceId = minionCard.dataset.instanceId;
    const minion = myState?.me?.board?.find((item) => item.instanceId === instanceId);
    if (!myState?.isYourTurn || !minion?.canAttack || (minion.attack || 0) <= 0) return;
    startDrag(event, minionCard, "attack", { instanceId });
  });

  document.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    const threshold = event.pointerType === "touch" ? MOVE_THRESHOLD + 6 : MOVE_THRESHOLD;
    if (distance < threshold) return;
    const dragStarted = !drag.moved;
    drag.moved = true;
    if (dragStarted && (drag.type === "attack" || drag.type === "targeted-spell")) {
      notifySpellDrag("arcana:targeting-start");
    }
    if (dragStarted && drag.type === "targeted-spell") {
      notifySpellDrag("arcana:spell-drag-start");
    }
    drag.source.classList.add("card-dragging");
    drag.source.classList.toggle("card-dragging-attack", drag.type === "attack");
    drag.source.classList.toggle("card-dragging-hand", drag.type !== "attack");
    if (drag.type !== "attack") moveHandCard(event.clientX, event.clientY);
    drawArrow(event.clientX, event.clientY);
    event.preventDefault();
  }, { passive: false });

  document.addEventListener("pointerup", (event) => {
    if (!drag) return;
    const activeDrag = drag;
    let played = false;
    if (activeDrag.moved) {
      if (activeDrag.type === "attack") {
        played = finishAttack(event.clientX, event.clientY);
      } else {
        played = finishHandDrag(event.clientX, event.clientY);
      }
      // A completed drag, including a cancelled one, must not fall through
      // into the click-to-play or click-to-attack controls.
      suppressDragClick(activeDrag.source);
    }
    if (activeDrag.moved && (activeDrag.type === "attack" || activeDrag.type === "targeted-spell")) {
      notifySpellDrag("arcana:targeting-end", { played });
    }
    if (activeDrag.moved && activeDrag.type === "targeted-spell") {
      notifySpellDrag("arcana:spell-drag-end", { played });
    }
    clearDrag();
  });

  document.addEventListener("pointercancel", () => {
    if (drag?.moved && (drag.type === "attack" || drag.type === "targeted-spell")) {
      notifySpellDrag("arcana:targeting-end", { played: false });
    }
    if (drag?.moved && drag.type === "targeted-spell") {
      notifySpellDrag("arcana:spell-drag-end", { played: false });
    }
    clearDrag();
  });

  document.addEventListener("click", (event) => {
    if (!suppressNextClick) return;
    const isDragClick = suppressedDragSource?.contains(event.target);
    clearSuppressedClick();
    if (isDragClick) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();
