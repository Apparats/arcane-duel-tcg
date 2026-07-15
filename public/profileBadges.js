// Decorative SVG seals for profile titles and achievements.
(function () {
  const ART = {
    initiate: '<path d="m32 13 5 13 13 6-13 5-5 14-5-14-13-5 13-6z"/><path d="M32 22v20M22 32h20"/>',
    "first-blood": '<path d="M32 13c8 10 11 15 11 21a11 11 0 0 1-22 0c0-6 3-11 11-21Z"/><path d="M26 38c2 3 5 4 8 4"/>',
    spellbreaker: '<path d="m36 11-15 22h11l-4 20 15-24H32z"/><path d="m18 17 4 3M46 17l-4 3"/>',
    "duel-master": '<path d="m16 25 3-12 9 7 4-10 4 10 9-7 3 12-6 14H22z"/><path d="M24 43h16M28 49h8"/>',
    "ranked-vanguard": '<path d="M18 50V22l14-10 14 10v28z"/><path d="M25 50V31h14v19M25 24h14M32 16v9"/>',
    "vault-keeper": '<circle cx="27" cy="30" r="9"/><path d="m34 36 13 13M42 44l4-4M46 48l4-4"/><path d="M22 30h10"/>',
    "gate-walker": '<path d="M16 51V23c0-9 7-15 16-15s16 6 16 15v28"/><path d="M23 51V25c0-5 4-9 9-9s9 4 9 9v26M13 51h38"/>',
    frostbound: '<path d="M32 10v44M13 21l38 22M13 43l38-22"/><path d="m27 16 5-6 5 6M27 48l5 6 5-6M18 25l-5-4 2 7M46 39l5 4-2-7"/>',
    "relic-keeper": '<path d="m32 10 15 12-15 32L17 22z"/><path d="m17 22 15 8 15-8M32 30v24"/><circle cx="32" cy="22" r="3"/>',
    "machine-breaker": '<path d="m32 12 4 6 8-1 1 8 7 4-5 6 5 6-7 4-1 8-8-1-4 6-4-6-8 1-1-8-7-4 5-6-5-6 7-4 1-8 8 1z"/><circle cx="32" cy="35" r="8"/><path d="M32 27v16M24 35h16"/>',
    "johnnys-bane": '<path d="m18 16 28 28M46 16 18 44"/><path d="m15 13 6 3-4 4-4-6zm34 0-6 3 4 4 4-6zM14 47l7-3-4-4-3 7zm36 0-7-3 4-4 3 7z"/><circle cx="32" cy="30" r="4"/>',
    "first-victory": '<path d="m21 18 11-7 11 7v16c0 9-5 15-11 19-6-4-11-10-11-19z"/><path d="m26 31 4 4 8-9"/>',
    "tenfold-triumph": '<path d="M18 13h28v30H18z"/><path d="M24 23v-5M40 23v-5M25 35h14M32 28v14"/><path d="M14 49h36"/>',
    "ranked-awakening": '<path d="M32 11c8 9 14 17 10 29-2 8-9 13-18 11-8-2-12-10-8-18 2-5 8-11 16-22Z"/><path d="M30 27c-4 6-3 12 2 16"/>',
    "arcane-arsenal": '<path d="m19 44 7-27 6 10 6-10 7 27z"/><path d="m19 44 13 8 13-8M26 17l6-7 6 7"/><path d="M24 36h16"/>',
    "seasoned-duelist": '<path d="M18 49V29c0-11 6-18 14-18s14 7 14 18v20"/><path d="M18 30h28M24 24l4 5M40 24l-4 5M26 39h12"/>',
    "unbroken-will": '<path d="M18 23c0-7 6-12 14-5 8-7 14-2 14 5 0 12-14 23-14 23S18 35 18 23Z"/><path d="m23 30 6 6 12-13"/>',
    "gate-opened": '<path d="M16 51V17h24v34"/><path d="M24 51V23h16v28M16 17l16-8 16 8M35 36h1"/>',
    "endless-winter": '<circle cx="32" cy="32" r="20"/><path d="M32 8v10M32 46v10M8 32h10M46 32h10M15 15l7 7M42 42l7 7M49 15l-7 7M22 42l-7 7"/><path d="m27 32 5-5 5 5-5 5z"/>',
    "npc-slayer": '<circle cx="32" cy="32" r="19"/><circle cx="32" cy="32" r="10"/><circle cx="32" cy="32" r="3"/><path d="M32 8v8M32 48v8M8 32h8M48 32h8"/>',
    "developer-down": '<path d="m20 16-9 16 9 16M44 16l9 16-9 16M28 47l8-30"/><path d="M25 21h14v22H25z"/><path d="M29 28h6M29 35h6"/>',
    "pack-apprentice": '<path d="M19 19h26v30H19z"/><path d="M23 15h18v4H23zM25 27h14M25 34h14M25 41h9"/>',
    "thirty-triumphs": '<path d="M17 15h30v34H17z"/><path d="M24 24h16M24 32h16M24 40h16"/><path d="m27 20 5-6 5 6"/>',
    "quickplay-regular": '<path d="M32 11c9 8 14 14 14 23a14 14 0 1 1-28 0c0-9 5-15 14-23Z"/><path d="m34 20-8 14h7l-3 10 9-14h-7z"/>',
    "campaign-veteran": '<path d="M16 50V21l16-10 16 10v29"/><path d="M22 50V26l10-6 10 6v24M27 35h10M32 20v30"/>',
    "bot-bane": '<path d="M18 24h28v22H18z"/><path d="M24 24v-6h16v6M24 35h1M39 35h1M28 42h8"/><path d="M12 30h6M46 30h6"/>',
    "collectors-sigil": '<path d="M18 18h28v28H18z"/><path d="m18 18 14 10 14-10M32 28v18"/><circle cx="32" cy="18" r="5"/>',
    "mythic-constellation": '<path d="m32 10 5 13 14 1-11 9 4 14-12-8-12 8 4-14-11-9 14-1z"/><circle cx="32" cy="29" r="4"/><circle cx="20" cy="20" r="2"/><circle cx="45" cy="21" r="2"/><circle cx="18" cy="44" r="2"/><circle cx="46" cy="44" r="2"/><path d="m22 21 7 6m14 0 7-6M21 42l8-9m14 0 8 9M22 47l10 7 10-7"/>',
    "more-than-honorable": '<path d="M20 13h24v17c0 11-5 18-12 24-7-6-12-13-12-24z"/><path d="m23 19 9 6 9-6v13l-9 6-9-6z"/><path d="m25 40 7 7 7-7"/><circle cx="32" cy="30" r="4"/><path d="M17 17 11 11M47 17l6-6M15 47l-5 5M49 47l5 5"/>',
    "crown-of-arcana": '<path d="M16 21 22 13l10 9 10-9 6 8-4 24H20z"/><path d="m16 21 9 7 7-6 7 6 9-7M20 45h24M24 51h16"/><circle cx="32" cy="31" r="4"/><path d="M13 17 8 12M51 17l5-5M16 49l-5 5M48 49l5 5"/>',
  };

  const PALETTES = {
    frostbound: ["#bdefff", "#4fc3e8"],
    "endless-winter": ["#d7f7ff", "#57bde4"],
    "gate-walker": ["#e8b34f", "#b36f32"],
    "gate-opened": ["#e8b34f", "#b36f32"],
    "relic-keeper": ["#df83ff", "#8b5bd4"],
    "arcane-arsenal": ["#df83ff", "#8b5bd4"],
    "johnnys-bane": ["#ff8b83", "#bc3f4e"],
    "developer-down": ["#ff8b83", "#bc3f4e"],
    "machine-breaker": ["#dfe7ed", "#71839b"],
    "npc-slayer": ["#dfe7ed", "#71839b"],
    "mythic-constellation": ["#f6d580", "#8f58c8"],
    "more-than-honorable": ["#ffe6a3", "#cd8052"],
    "crown-of-arcana": ["#ffe28a", "#c53e58"],
  };

  function badgeMarkup(id, unlocked) {
    const [main, accent] = PALETTES[id] || ["#f3ca75", "#4fc3e8"];
    const art = ART[id] || ART.initiate;
    return `
      <svg class="profile-badge-svg${unlocked ? " is-unlocked" : ""}" viewBox="0 0 64 64" role="img" aria-label="${unlocked ? "Unlocked" : "Locked"} badge" style="--badge-main:${main};--badge-accent:${accent}">
        <path class="badge-outer" d="M32 3 40 7l9-1 4 8 8 4-1 9 4 8-4 8 1 9-8 4-4 8-9-1-8 4-8-4-9 1-4-8-8-4 1-9-4-8 4-8-1-9 8-4 4-8 9 1z"/>
        <path class="badge-inner" d="M32 9 39 13l8-1 3 7 7 3-1 8 4 7-4 7 1 8-7 3-3 7-8-1-7 4-7-4-8 1-3-7-7-3 1-8-4-7 4-7-1-8 7-3 3-7 8 1z"/>
        <circle class="badge-ring" cx="32" cy="32" r="21"/>
        <path class="badge-rays" d="M32 7v6M32 51v6M7 32h6M51 32h6M14 14l4 4M46 46l4 4M50 14l-4 4M18 46l-4 4"/>
        <g class="badge-art">${art}</g>
        <circle class="badge-gem" cx="32" cy="58" r="2.5"/>
      </svg>`;
  }

  window.ArcaneProfileBadges = { badgeMarkup };
})();
