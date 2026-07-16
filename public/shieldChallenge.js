// Shield Trial is isolated from the card UI. The server owns arrow timing and
// damage; this module only renders the challenge and reports shield direction.
(() => {
  const DIRECTIONS = new Set(["up", "right", "down", "left"]);
  const KEY_DIRECTIONS = {
    ArrowUp: "up", KeyW: "up",
    ArrowRight: "right", KeyD: "right",
    ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left",
  };
  const VECTORS = {
    up: [0, -1, 0],
    right: [1, 0, 90],
    down: [0, 1, 180],
    left: [-1, 0, -90],
  };

  const root = document.getElementById("shieldChallenge");
  const arena = document.getElementById("shieldChallengeArena");
  const shield = document.getElementById("shieldChallengeShield");
  const result = document.getElementById("shieldChallengeResult");
  const title = document.getElementById("shieldChallengeTitle");
  if (!root || !arena || !shield || !result) return;

  let active = null;
  let frame = null;
  let reportDirection = null;

  function setDirection(direction) {
    if (!active || !DIRECTIONS.has(direction)) return;
    if (active.direction === direction) return;
    active.direction = direction;
    shield.dataset.direction = direction;
    root.querySelectorAll("[data-shield-direction]").forEach((button) => {
      button.classList.toggle("active", button.dataset.shieldDirection === direction);
    });
    reportDirection?.(active.id, direction);
  }

  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    active = null;
    root.classList.add("hidden");
    arena.querySelectorAll(".shield-challenge-arrow").forEach((arrow) => arrow.remove());
  }

  function renderFrame() {
    if (!active) return;
    const now = Date.now();
    active.arrows.forEach((arrow) => {
      const progress = (now - (arrow.impactAt - active.travelMs)) / active.travelMs;
      if (arrow.resolved || progress < -0.08) return;
      if (progress >= 1) {
        arrow.resolved = true;
        arrow.element?.remove();
        window.ArcaneAudio?.playSfx(active.direction === arrow.direction ? "shieldBlock" : "shieldHit");
        return;
      }
      if (!arrow.element) {
        arrow.element = document.createElement("span");
        arrow.element.className = "shield-challenge-arrow";
        arrow.element.innerHTML = "&#x25BC;";
        arena.appendChild(arrow.element);
      }
      const [x, y, rotation] = VECTORS[arrow.direction];
      const distance = Math.max(0, 132 * (1 - Math.min(progress, 1)));
      arrow.element.style.left = `calc(50% + ${x * distance}px)`;
      arrow.element.style.top = `calc(50% + ${y * distance}px)`;
      arrow.element.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    });
    if (now < active.endsAt + 120) frame = requestAnimationFrame(renderFrame);
  }

  function start(payload, onDirection) {
    stop();
    if (!payload || !Array.isArray(payload.arrows) || !Number.isFinite(payload.travelMs)) return;
    reportDirection = onDirection;
    const startsAt = Date.now() + Math.max(0, Number(payload.startInMs) || 0);
    active = {
      id: payload.challengeId,
      arrows: payload.arrows.map((arrow) => ({
        direction: arrow.direction,
        impactAt: startsAt + Number(arrow.impactOffsetMs || 0),
      })),
      travelMs: payload.travelMs,
      endsAt: startsAt + Math.max(0, Number(payload.durationMs) || 0),
      direction: null,
    };
    result.textContent = "";
    if (title) title.textContent = `${payload.sourceName || "Shield"}'s Shield Trial`;
    shield.dataset.direction = "down";
    root.classList.remove("hidden");
    setDirection("down");
    frame = requestAnimationFrame(renderFrame);
  }

  root.querySelectorAll("[data-shield-direction]").forEach((button) => {
    button.addEventListener("click", () => setDirection(button.dataset.shieldDirection));
  });

  let swipe = null;
  arena.addEventListener("pointerdown", (event) => {
    if (!active || (event.pointerType === "mouse" && event.button !== 0)) return;
    swipe = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
    arena.setPointerCapture?.(event.pointerId);
  });
  arena.addEventListener("pointermove", (event) => {
    if (!active || !swipe || swipe.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - swipe.startX;
    const deltaY = event.clientY - swipe.startY;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 12) return;
    setDirection(Math.abs(deltaX) > Math.abs(deltaY)
      ? (deltaX > 0 ? "right" : "left")
      : (deltaY > 0 ? "down" : "up"));
    event.preventDefault();
  }, { passive: false });
  ["pointerup", "pointercancel"].forEach((eventName) => {
    arena.addEventListener(eventName, (event) => {
      if (swipe?.pointerId === event.pointerId) swipe = null;
    });
  });

  document.addEventListener("keydown", (event) => {
    const direction = KEY_DIRECTIONS[event.code];
    if (!direction || !active) return;
    event.preventDefault();
    setDirection(direction);
  });

  window.ArcaneShieldChallenge = {
    start,
    finish(payload) {
      if (!active) return;
      const damage = Number(payload?.damage || 0);
      const blocked = Number(payload?.blocked || 0);
      const hits = Number(payload?.hits || 0);
      result.textContent = damage > 0
        ? `${blocked} blocked - ${damage} damage taken`
        : hits > 0 ? `${blocked} blocked - no damage` : "All arrows blocked";
      setTimeout(stop, 900);
    },
    stop,
  };
})();
