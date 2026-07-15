window.ArcaneAudioConfig = {
  enabled: true,
  masterVolume: 1,
  musicVolume: 0.15,
  sfxVolume: 0.24,
  assetsBasePath: "assets/audio/",

  music: {
    mainMenu: {
      src: [
        "music/MainMenu2.ogg",
        "music/MainMenu3.ogg",
        "music/MainMenu4.ogg",
        "music/MainMenu5.ogg",
        "music/MainMenu6.ogg",
      ],
      loop: true,
      volume: 1,
    },
    board: {
      src: [
        "music/Board1.ogg",
        "music/Board2.ogg",
        "music/Board4.ogg",
        "music/Board5.ogg",
        "music/Board6.ogg",
        "music/Board7.ogg",
      ],
      loop: true,
      volume: 1,
    },
  },

  sfx: {
    menuClick: "sfx/tap3.wav",
    uiClick: "sfx/tap2.wav",
    hit: "sfx/hit.wav",
    victory: "sfx/winner.wav",
    defeat: "sfx/loses.wav",
    cardPlay: "sfx/card.wav",
    attack: "",
    endTurn: "",
    surrender: "",
    packOpen: "",
    cardReveal: "sfx/card.wav",
    tradeConfirm: "",
  },

  // Slight pitch movement keeps repeated impacts from sounding identical.
  // Playback-rate changes reuse the same preloaded audio voices.
  sfxPlaybackRates: {
    hit: [0.92, 1.08],
  },

  musicByScreen: {
    menu: "mainMenu",
    lobby: "mainMenu",
    inventory: "mainMenu",
    shop: "mainMenu",
    trade: "mainMenu",
    profile: "mainMenu",
    game: "board",
  },
};
