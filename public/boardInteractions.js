// ============================================================
// BOARD INTERACTIONS - Pointer-event gestures for hand-to-board
// plays and minion attack targeting. Rules remain server-authoritative.
// ============================================================

(() => {
  const board = document.querySelector(".board");
  const arrowPath = document.getElementById("targetingArrowPath");
  if (!board || !arrowPath) return;

  const MOVE_THRESHOLD = 10;
  let drag = null;
  let suppressNextClick = false;

  function closest(target, selector) {
    return target && target.nodeType === Node.ELEMENT_NODE ? target.closest(selector) : null;
  }

  function clearArrow() {
    arrowPath.setAttribute("d", "");
  }

  function clearDrag() {
    if (drag?.source) drag.source.classList.remove("card-dragging");
    drag = null;
    clearArrow();
  }

  function startDrag(event, source, type, payload) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag = {
      source,
      type,
      payload,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    source.setPointerCapture?.(event.pointerId);
  }

  function drawArrow(clientX, clientY) {
    if (!drag || (drag.type !== "attack" && drag.type !== "targeted-spell")) return;
    const sourceRect = drag.source.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const startX = sourceRect.left - boardRect.left + sourceRect.width / 2;
    const startY = sourceRect.top - boardRect.top + sourceRect.height / 2;
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

  function finishAttack(clientX, clientY) {
    const target = targetFromPoint(clientX, clientY);
    if (!target || (target.id === "self")) return;
    window.ArcaneAudio?.playSfx("attack");
    send("attack", { attackerInstanceId: drag.payload.instanceId, targetInstanceId: target.id });
    selectedAttackerId = null;
  }

  function finishHandDrag(clientX, clientY) {
    const { card, handIndex } = drag.payload;
    const target = targetFromPoint(clientX, clientY);
    const overSelfBoard = Boolean(closest(document.elementFromPoint(clientX, clientY), "#selfBoard"));

    if (card.type === "minion") {
      if (!overSelfBoard) return;
      window.ArcaneAudio?.playSfx("cardPlay");
      pendingHandPlayAnimation = { cardId: card.id, rect: drag.source.getBoundingClientRect(), createdAt: performance.now() };
      send("playCard", { handIndex, targetInstanceId: null });
      return;
    }

    if (card.effect === "draw" || !card.effect) {
      if (!overSelfBoard) return;
      window.ArcaneAudio?.playSfx("cardPlay");
      send("playCard", { handIndex, targetInstanceId: null });
      return;
    }

    if (!target) return;
    const healTarget = target.id === "self" || target.minion?.parentElement?.id === "selfBoard";
    if (card.effect === "heal" ? !healTarget : healTarget) return;
    window.ArcaneAudio?.playSfx("cardPlay");
    send("playCard", { handIndex, targetInstanceId: target.id });
    selectedHandIndex = null;
    hideTargetHint();
  }

  board.addEventListener("pointerdown", (event) => {
    const handCard = closest(event.target, ".hand-card");
    if (handCard) {
      const handIndex = Number(handCard.dataset.handIndex);
      const card = myState?.me?.hand?.[handIndex];
      if (!myState?.isYourTurn || !card || card.cost > myState.me.manaCurrent) return;
      const targetedSpell = card.type === "spell" && card.effect && card.effect !== "draw";
      startDrag(event, handCard, targetedSpell ? "targeted-spell" : "hand", { card, handIndex });
      return;
    }

    const minionCard = closest(event.target, "#selfBoard .minion-card");
    if (!minionCard) return;
    const instanceId = minionCard.dataset.instanceId;
    const minion = myState?.me?.board?.find((item) => item.instanceId === instanceId);
    if (!myState?.isYourTurn || !minion?.canAttack) return;
    startDrag(event, minionCard, "attack", { instanceId });
  });

  document.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (distance < MOVE_THRESHOLD) return;
    drag.moved = true;
    drag.source.classList.add("card-dragging");
    drawArrow(event.clientX, event.clientY);
    event.preventDefault();
  }, { passive: false });

  document.addEventListener("pointerup", (event) => {
    if (!drag) return;
    const activeDrag = drag;
    if (activeDrag.moved) {
      suppressNextClick = true;
      if (activeDrag.type === "attack") finishAttack(event.clientX, event.clientY);
      else finishHandDrag(event.clientX, event.clientY);
    }
    clearDrag();
  });

  document.addEventListener("pointercancel", clearDrag);

  document.addEventListener("click", (event) => {
    if (!suppressNextClick) return;
    suppressNextClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
})();
