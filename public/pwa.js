(() => {
  const DISMISS_KEY = "arcanaPwaInstallDismissedAt";
  const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000;
  let installPrompt = null;
  let notice = null;

  const isInstalled = () => (
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
  );

  const recentlyDismissed = () => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_DURATION_MS;
  };

  const canShowNotice = () => (
    installPrompt
    && !notice
    && !isInstalled()
    && !recentlyDismissed()
    && !document.querySelector("#screen-menu")?.classList.contains("hidden")
  );

  const removeNotice = () => {
    notice?.remove();
    notice = null;
  };

  const dismissNotice = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    removeNotice();
  };

  const showNotice = () => {
    if (!canShowNotice()) return;

    notice = document.createElement("aside");
    notice.className = "pwa-install-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-label", "Install Arcana TCG");
    notice.innerHTML = `
      <img class="pwa-install-icon" src="pwa-icon-192.png" alt="" width="48" height="48" />
      <div class="pwa-install-copy">
        <strong>Install Arcana TCG</strong>
        <span>Open the game from your desktop or home screen.</span>
      </div>
      <div class="pwa-install-actions">
        <button class="pwa-install-button" type="button">Install</button>
        <button class="pwa-install-dismiss" type="button" aria-label="Not now" title="Not now">x</button>
      </div>
    `;

    notice.querySelector(".pwa-install-dismiss")?.addEventListener("click", dismissNotice);
    notice.querySelector(".pwa-install-button")?.addEventListener("click", async () => {
      if (!installPrompt) return;
      const prompt = installPrompt;
      installPrompt = null;
      removeNotice();
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome !== "accepted") localStorage.setItem(DISMISS_KEY, String(Date.now()));
    });

    document.body.append(notice);
  };

  if (!("serviceWorker" in navigator) || !window.isSecureContext || window.top !== window || isInstalled()) return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    window.setTimeout(showNotice, 700);
  });

  window.addEventListener("appinstalled", () => {
    localStorage.removeItem(DISMISS_KEY);
    installPrompt = null;
    removeNotice();
  });

  const syncNoticeWithMenu = () => {
    if (document.querySelector("#screen-menu")?.classList.contains("hidden")) {
      removeNotice();
      return;
    }
    showNotice();
  };

  new MutationObserver(syncNoticeWithMenu).observe(document.querySelector("#screen-menu"), {
    attributes: true,
    attributeFilter: ["class"],
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js", { scope: "/" }).catch(() => {
      // The game remains fully usable when installation support is unavailable.
    });
  });
})();
