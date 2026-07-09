window.ArcaneAudioConfig = {
  enabled: true,
  masterVolume: 1,
  musicVolume: 0.15,
  sfxVolume: 0.24,
  assetsBasePath: "assets/audio/",

  music: {
    mainMenu: {
      src: [
        "music/MainMenu1.ogg",
        "music/mainMenu2.ogg",
        "music/mainMenu3.ogg",
        "music/mainMenu4.ogg",
      ],
      loop: true,
      volume: 1,
    },
    board: {
      src: [
        "music/Board1.ogg",
        "music/Board2.ogg",
        "music/Board3.ogg",
        "music/Board4.ogg",
        "music/Board5.ogg",
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

  musicByScreen: {
    menu: "mainMenu",
    lobby: "mainMenu",
    inventory: "mainMenu",
    shop: "mainMenu",
    trade: "mainMenu",
    game: "board",
  },
};
