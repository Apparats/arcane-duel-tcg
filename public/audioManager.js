(function () {
  const config = window.ArcaneAudioConfig || {};
  const musicCache = new Map();
  const musicState = new Map();
  const sfxCache = new Map();
  const sfxVoicePools = new Map();
  const STORAGE_KEY = "arcane_audio_volumes";
  const MUSIC_FADE_MS = 650;

  let unlocked = false;
  let currentMusicId = null;
  let currentMusic = null;
  let currentMusicLocalVolume = 1;
  const fadeTimers = new WeakMap();
  const MAX_SFX_VOICES = 4;

  function clampVolume(value, fallback = 1) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(0, Math.min(1, number));
  }

  function loadSavedVolumes() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (saved.music !== undefined) config.musicVolume = clampVolume(saved.music, config.musicVolume ?? 1);
      if (saved.sfx !== undefined) config.sfxVolume = clampVolume(saved.sfx, config.sfxVolume ?? 1);
    } catch (err) {
      // Ignore storage errors; defaults still apply.
    }
  }

  function saveVolumes() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          music: clampVolume(config.musicVolume ?? 1),
          sfx: clampVolume(config.sfxVolume ?? 1),
        })
      );
    } catch (err) {
      // Ignore storage errors; audio remains usable for this session.
    }
  }

  function isEnabled() {
    return config.enabled !== false;
  }

  function assetUrl(src) {
    if (!src) return "";
    if (/^(https?:)?\/\//.test(src) || src.startsWith("/")) return src;
    return `${config.assetsBasePath || ""}${src}`;
  }

  function pickSource(entry) {
    if (Array.isArray(entry)) return entry[Math.floor(Math.random() * entry.length)];
    return entry;
  }

  function musicSources(entry) {
    if (!entry?.src) return [];
    return (Array.isArray(entry.src) ? entry.src : [entry.src]).filter(Boolean);
  }

  function createAudio(src, { loop = false, volume = 1 } = {}) {
    const audio = new Audio(assetUrl(src));
    audio.preload = "auto";
    audio.loop = loop;
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.addEventListener("error", () => {
      console.warn("Audio failed to load:", audio.src);
    });
    return audio;
  }

  function cancelFade(audio) {
    const timer = fadeTimers.get(audio);
    if (timer) {
      clearInterval(timer);
      fadeTimers.delete(audio);
    }
  }

  function effectiveVolume(kind, localVolume = 1) {
    const master = config.masterVolume ?? 1;
    const channel = kind === "music" ? config.musicVolume ?? 1 : config.sfxVolume ?? 1;
    return clampVolume(master * channel * localVolume);
  }

  function fadeAudio(audio, toVolume, { duration = MUSIC_FADE_MS, pauseAtEnd = false, resetAtEnd = false } = {}) {
    if (!audio) return Promise.resolve();
    cancelFade(audio);
    const targetVolume = clampVolume(toVolume);
    const fromVolume = clampVolume(audio.volume);
    if (duration <= 0 || Math.abs(fromVolume - targetVolume) < 0.001) {
      audio.volume = targetVolume;
      if (pauseAtEnd) audio.pause();
      if (resetAtEnd) audio.currentTime = 0;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const startedAt = performance.now();
      const timer = setInterval(() => {
        const progress = Math.min(1, (performance.now() - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 2);
        audio.volume = clampVolume(fromVolume + (targetVolume - fromVolume) * eased);
        if (progress >= 1) {
          clearInterval(timer);
          fadeTimers.delete(audio);
          audio.volume = targetVolume;
          if (pauseAtEnd) audio.pause();
          if (resetAtEnd) audio.currentTime = 0;
          resolve();
        }
      }, 33);
      fadeTimers.set(audio, timer);
    });
  }

  function refreshCachedVolumes() {
    musicCache.forEach((audio, key) => {
      const musicId = key.split(":")[0];
      const entry = config.music?.[musicId];
      const targetVolume = effectiveVolume("music", entry?.volume ?? 1);
      if (audio === currentMusic && !audio.paused) {
        fadeAudio(audio, targetVolume, { duration: MUSIC_FADE_MS });
      } else {
        audio.volume = targetVolume;
      }
    });
    sfxCache.forEach((audio) => {
      audio.volume = effectiveVolume("sfx");
    });
  }

  function setChannelVolume(kind, value) {
    const volume = clampVolume(value, kind === "music" ? config.musicVolume ?? 1 : config.sfxVolume ?? 1);
    if (kind === "music") config.musicVolume = volume;
    if (kind === "sfx") config.sfxVolume = volume;
    saveVolumes();
    refreshCachedVolumes();
    return volume;
  }

  function getChannelVolume(kind) {
    return clampVolume(kind === "music" ? config.musicVolume ?? 1 : config.sfxVolume ?? 1);
  }

  async function unlock() {
    if (!isEnabled()) return false;
    unlocked = true;
    preloadSfx();
    if (currentMusicId) await playMusic(currentMusicId);
    return true;
  }

  function nextMusicSource(id, advance = false) {
    const entry = config.music?.[id];
    const sources = musicSources(entry);
    if (sources.length === 0) return null;

    if (!musicState.has(id)) {
      musicState.set(id, { index: Math.floor(Math.random() * sources.length) });
    }
    const state = musicState.get(id);
    if (advance) state.index = (state.index + 1) % sources.length;
    return sources[state.index % sources.length];
  }

  function getMusic(id, { advance = false } = {}) {
    const entry = config.music?.[id];
    const source = nextMusicSource(id, advance);
    if (!source) return null;

    const sources = musicSources(entry);
    const cacheKey = `${id}:${source}`;
    if (!musicCache.has(cacheKey)) {
      const audio = createAudio(source, {
        loop: entry.loop !== false && sources.length === 1,
        volume: effectiveVolume("music", entry.volume ?? 1),
      });
      audio.addEventListener("ended", () => {
        if (currentMusicId === id && entry.loop !== false) playMusic(id, { advance: true });
      });
      musicCache.set(cacheKey, audio);
    }
    return musicCache.get(cacheKey);
  }

  async function playMusic(id, options = {}) {
    if (!isEnabled()) return;
    currentMusicId = id;
    if (!unlocked) return;

    const next = getMusic(id, options);
    if (!next) return;
    if (currentMusic && currentMusic !== next) {
      fadeAudio(currentMusic, 0, { pauseAtEnd: true, resetAtEnd: true });
    }
    currentMusic = next;
    currentMusicLocalVolume = config.music?.[id]?.volume ?? 1;
    const targetVolume = effectiveVolume("music", currentMusicLocalVolume);
    try {
      if (!currentMusic.paused && Math.abs(currentMusic.volume - targetVolume) < 0.01) return;
      cancelFade(currentMusic);
      if (currentMusic.paused || currentMusic.currentTime === 0) currentMusic.volume = 0;
      await currentMusic.play();
      fadeAudio(currentMusic, targetVolume, { duration: MUSIC_FADE_MS });
    } catch (err) {
      console.warn("Music playback was blocked or failed:", err.message);
    }
  }

  function stopMusic({ immediate = false } = {}) {
    if (!currentMusic) return;
    if (immediate) {
      cancelFade(currentMusic);
      currentMusic.pause();
      currentMusic.currentTime = 0;
      currentMusic = null;
      currentMusicId = null;
      return;
    }
    fadeAudio(currentMusic, 0, { pauseAtEnd: true, resetAtEnd: true });
    currentMusic = null;
    currentMusicId = null;
  }

  function getSfx(id) {
    const source = pickSource(config.sfx?.[id]);
    if (!source) return null;
    const cacheKey = `${id}:${source}`;
    if (!sfxCache.has(cacheKey)) {
      sfxCache.set(cacheKey, createAudio(source, { volume: effectiveVolume("sfx") }));
    }
    return sfxCache.get(cacheKey);
  }

  function preloadSfx() {
    Object.keys(config.sfx || {}).forEach((id) => {
      const audio = getSfx(id);
      audio?.load();
    });
  }

  function getSfxVoice(id) {
    const base = getSfx(id);
    if (!base) return null;
    const key = `${id}:${base.src}`;
    const pool = sfxVoicePools.get(key) || [base];
    sfxVoicePools.set(key, pool);

    const idle = pool.find((audio) => audio.paused || audio.ended);
    if (idle) return idle;
    if (pool.length < MAX_SFX_VOICES) {
      const voice = base.cloneNode();
      voice.preload = "auto";
      pool.push(voice);
      return voice;
    }
    return pool[0];
  }

  function playbackRateFor(id) {
    const configuredRange = config.sfxPlaybackRates?.[id];
    const [minimum, maximum] = Array.isArray(configuredRange) ? configuredRange : [0.98, 1.02];
    const low = Number.isFinite(Number(minimum)) ? Number(minimum) : 0.98;
    const high = Number.isFinite(Number(maximum)) ? Number(maximum) : 1.02;
    const start = Math.max(0.5, Math.min(low, high));
    const end = Math.min(2, Math.max(low, high));
    return start + Math.random() * (end - start);
  }

  function playSfx(id) {
    if (!isEnabled() || !unlocked) return;
    const sound = getSfxVoice(id);
    if (!sound) return;
    sound.pause();
    sound.currentTime = 0;
    sound.volume = effectiveVolume("sfx");
    sound.playbackRate = playbackRateFor(id);
    sound.play().catch(() => {});
  }

  function onScreenChange(screenName) {
    const musicId = config.musicByScreen?.[screenName];
    if (musicId) {
      playMusic(musicId);
      return;
    }
    stopMusic();
  }

  document.addEventListener(
    "click",
    (event) => {
      if (!unlocked) unlock();
      const target = event.target;
      const clickable =
        target && target.nodeType === Node.ELEMENT_NODE
          ? target.closest("button, .menu-tile, .inventory-tab, .trade-card-button, .deck-row")
          : null;
      if (clickable) {
        playSfx(clickable.closest("#screen-menu") ? "menuClick" : "uiClick");
      }
    },
    true
  );

  loadSavedVolumes();

  window.ArcaneAudio = {
    unlock,
    playMusic,
    stopMusic,
    playSfx,
    onScreenChange,
    getChannelVolume,
    setChannelVolume,
    preloadSfx,
    get unlocked() {
      return unlocked;
    },
  };
})();
