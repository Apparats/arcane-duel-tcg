// ============================================================
// ⚠️  GENERATED FILE — DO NOT EDIT BY HAND.
// Generated with "npm run cards:build" from expansions/.
// To add, remove, or change cards, edit the files there and run
// the build again. See README.md → "Adding cards".
// ============================================================

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.TCGCards = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {

  const CARDS = [
    {
      "name": "Abdellah",
      "cost": 0,
      "type": "minion",
      "attack": 0,
      "health": 2,
      "keywords": [
        "taunt"
      ],
      "race": "Human",
      "rarity": "common",
      "country": "Morocco",
      "lore": "A quick learner who finds a route through every opening.",
      "image": "art/Abdellah.webp",
      "id": "expansion1:abdellah",
      "_expansionId": "expansion1"
    },
    {
      "name": "Abo_Amer",
      "cost": 2,
      "type": "minion",
      "attack": 3,
      "health": 1,
      "keywords": [],
      "race": "Human",
      "rarity": "rare",
      "country": "Egypt",
      "lore": "A daring opener who turns the first mana into immediate pressure.",
      "image": "art/Abo_Amer.webp",
      "id": "expansion1:abo-amer",
      "_expansionId": "expansion1"
    },
    {
      "name": "Arcane Reading",
      "cost": 2,
      "type": "spell",
      "effect": "draw",
      "value": 2,
      "rarity": "common",
      "country": "Arcana",
      "lore": "Draw 2 cards.",
      "image": "art/ArcaneReading.webp",
      "id": "expansion1:arcanereading",
      "_expansionId": "expansion1"
    },
    {
      "name": "Aslani",
      "cost": 3,
      "type": "minion",
      "attack": 3,
      "health": 1,
      "keywords": [
        "charge"
      ],
      "race": "Monster",
      "rarity": "common",
      "country": "Belgium",
      "lore": "A bright flash, a decisive strike, then silence.",
      "image": "art/Aslani.webp",
      "id": "expansion1:aslani",
      "_expansionId": "expansion1"
    },
    {
      "name": "Baatus",
      "cost": 2,
      "type": "minion",
      "attack": 0,
      "health": 6,
      "keywords": [
        "taunt"
      ],
      "race": "Monster",
      "rarity": "rare",
      "country": "Netherlands",
      "lore": "Allround Incapabel.",
      "image": "art/Baatus.webp",
      "id": "expansion1:baatus",
      "_expansionId": "expansion1"
    },
    {
      "name": "Biertierchen",
      "cost": 6,
      "type": "minion",
      "attack": 5,
      "health": 2,
      "keywords": [
        "charge"
      ],
      "race": "Human",
      "rarity": "rare",
      "country": "Germany",
      "lore": "Good boy!.",
      "image": "art/Biertierchen.webp",
      "id": "expansion1:biertierchen",
      "_expansionId": "expansion1"
    },
    {
      "name": "Crowley_The_Penguin",
      "cost": 8,
      "type": "minion",
      "attack": 2,
      "health": 14,
      "keywords": [
        "taunt"
      ],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Vatican",
      "lore": "On its first play, Crowley shields every friendly minion from the next hit.",
      "image": "art/Crowley_THE_Penguin.webp",
      "abilities": [
        {
          "trigger": "onPlay",
          "effect": "grantDivineShieldToAllFriendlyMinions",
          "firstPlayOnly": true
        }
      ],
      "id": "expansion1:crowley-the-penguin",
      "_expansionId": "expansion1"
    },
    {
      "name": "DIYslinky",
      "cost": 4,
      "type": "minion",
      "attack": 5,
      "health": 4,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Sweden",
      "lore": "The Great Angel of Sweden.",
      "image": "art/DIYSlinky.webp",
      "id": "expansion1:diyslinky",
      "_expansionId": "expansion1"
    },
    {
      "name": "Dantenie83",
      "cost": 4,
      "type": "minion",
      "attack": 2,
      "health": 7,
      "keywords": [],
      "race": "Human",
      "rarity": "rare",
      "country": "Romania",
      "lore": "Meme all or meme none!",
      "image": "art/Dantenie83.webp",
      "id": "expansion1:dantenie83",
      "_expansionId": "expansion1"
    },
    {
      "name": "Devastating Meteor",
      "cost": 7,
      "type": "spell",
      "effect": "damage",
      "value": 8,
      "rarity": "legendary",
      "country": "Arcana",
      "lore": "Deal 8 damage to a chosen target.",
      "image": "art/DevastatingMeteor.webp",
      "id": "expansion1:devastatingmeteor",
      "_expansionId": "expansion1"
    },
    {
      "name": "Elemental Fury",
      "cost": 5,
      "type": "spell",
      "effect": "damage",
      "value": 5,
      "rarity": "rare",
      "country": "Arcana",
      "lore": "Deal 5 damage to a chosen target.",
      "image": "art/ElementalFury.webp",
      "id": "expansion1:elementalfury",
      "_expansionId": "expansion1"
    },
    {
      "name": "Euler",
      "cost": 4,
      "type": "minion",
      "attack": 3,
      "health": 6,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Argentina",
      "lore": "Every angle of the duel has already been calculated.",
      "image": "art/Euler.webp",
      "id": "expansion1:euler",
      "_expansionId": "expansion1"
    },
    {
      "name": "Fanex",
      "cost": 6,
      "type": "minion",
      "attack": 6,
      "health": 10,
      "keywords": [],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Rwanda",
      "lore": "On play, steal a random minion from the enemy board and deploy it to your board.",
      "image": "art/Fanex.webp",
      "abilities": [
        {
          "trigger": "onPlay",
          "effect": "stealRandomEnemyBoardMinion"
        }
      ],
      "id": "expansion1:fanex",
      "_expansionId": "expansion1"
    },
    {
      "name": "Focused Bolt",
      "cost": 4,
      "type": "spell",
      "effect": "damage",
      "value": 4,
      "rarity": "common",
      "country": "Arcana",
      "lore": "Deal 4 damage to a chosen target.",
      "image": "art/FocusedBolt.webp",
      "id": "expansion1:focusedbolt",
      "_expansionId": "expansion1"
    },
    {
      "name": "Greater Blessing",
      "cost": 4,
      "type": "spell",
      "effect": "heal",
      "value": 6,
      "rarity": "rare",
      "country": "Arcana",
      "lore": "Heal a chosen minion or your hero for 6. Minion healing can exceed maximum Health.",
      "image": "art/GreaterBlessing.webp",
      "id": "expansion1:greaterblessing",
      "_expansionId": "expansion1"
    },
    {
      "name": "Jeraxes",
      "cost": 5,
      "type": "minion",
      "attack": 0,
      "health": 8,
      "keywords": [
        "taunt"
      ],
      "race": "Human",
      "rarity": "rare",
      "country": "EEUU",
      "lore": "Spreader of Democracy.",
      "image": "art/Jeraxes.webp",
      "id": "expansion1:jeraxes",
      "_expansionId": "expansion1"
    },
    {
      "name": "Light",
      "cost": 8,
      "type": "minion",
      "attack": 7,
      "health": 1,
      "keywords": [
        "charge"
      ],
      "race": "Monster",
      "rarity": "rare",
      "country": "Luxemburg",
      "lore": "Light moves first, leaving the board to catch up.",
      "image": "art/Light.webp",
      "id": "expansion1:light",
      "_expansionId": "expansion1"
    },
    {
      "name": "Makariozzz",
      "cost": 5,
      "type": "minion",
      "attack": 6,
      "health": 4,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Egypt",
      "lore": "Rise and rise , till lambs turn lions.",
      "image": "art/Makariozzz.webp",
      "id": "expansion1:makariozzz",
      "_expansionId": "expansion1"
    },
    {
      "name": "Manuchiliz",
      "cost": 5,
      "type": "minion",
      "attack": 5,
      "health": 10,
      "keywords": [],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Argentina",
      "lore": "Its arrival makes 4 of damage to all cards on the board, ally and enemy alike.",
      "image": "art/Manuchiliz.webp",
      "abilities": [
        {
          "trigger": "onPlay",
          "effect": "damageAllMinions",
          "value": 4
        }
      ],
      "id": "expansion1:manuchiliz",
      "_expansionId": "expansion1"
    },
    {
      "name": "Meow4glory",
      "cost": 4,
      "type": "minion",
      "attack": 2,
      "health": 8,
      "keywords": [],
      "race": "Monster",
      "rarity": "rare",
      "country": "Ukraine",
      "lore": "Полковий писар Війська Запорізького.",
      "image": "art/Meow4Glory.webp",
      "id": "expansion1:meow4glory",
      "_expansionId": "expansion1"
    },
    {
      "name": "Minor Fireball",
      "cost": 3,
      "type": "spell",
      "effect": "damage",
      "value": 3,
      "rarity": "common",
      "country": "Arcana",
      "lore": "Deal 3 damage to a chosen target.",
      "image": "art/MinorFireball.webp",
      "id": "expansion1:minorfireball",
      "_expansionId": "expansion1"
    },
    {
      "name": "Minor Spark",
      "cost": 2,
      "type": "spell",
      "effect": "damage",
      "value": 2,
      "rarity": "common",
      "country": "Arcana",
      "lore": "Deal 2 damage to a chosen target.",
      "image": "art/MinorSpark.webp",
      "id": "expansion1:minorspark",
      "_expansionId": "expansion1"
    },
    {
      "name": "Moonhammer",
      "cost": 10,
      "type": "minion",
      "attack": 4,
      "health": 8,
      "keywords": [
        "charge"
      ],
      "race": "Monster",
      "rarity": "legendary",
      "country": "Croatia",
      "lore": "Where the Moon rises, the Hammer falls.",
      "image": "art/Moonhammer.webp",
      "id": "expansion1:moonhammer",
      "_expansionId": "expansion1"
    },
    {
      "name": "Puipui_09",
      "cost": 6,
      "type": "minion",
      "attack": 5,
      "health": 8,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "France",
      "lore": "Cases!.",
      "image": "art/Puipui_09.webp",
      "id": "expansion1:puipui-09",
      "_expansionId": "expansion1"
    },
    {
      "name": "Quick Bandage",
      "cost": 2,
      "type": "spell",
      "effect": "heal",
      "value": 3,
      "rarity": "common",
      "country": "Arcana",
      "lore": "Heal a chosen minion or your hero for 3. Minion healing can exceed maximum Health.",
      "image": "art/QuickBandage.webp",
      "id": "expansion1:quickbandage",
      "_expansionId": "expansion1"
    },
    {
      "name": "Red",
      "cost": 8,
      "type": "minion",
      "attack": 0,
      "health": 11,
      "keywords": [],
      "race": "Human",
      "rarity": "mythic",
      "country": "Vatican",
      "lore": "At the start of each of your turns, Red calls RedWolf if the pack is gone.",
      "image": "art/Red.webp",
      "abilities": [
        {
          "trigger": "onTurnStart",
          "effect": "summonMinionIfMissing",
          "cardId": "special:redwolf"
        }
      ],
      "id": "expansion1:red",
      "_expansionId": "expansion1"
    },
    {
      "name": "Rockseller",
      "cost": 7,
      "type": "minion",
      "attack": 4,
      "health": 9,
      "keywords": [
        "taunt"
      ],
      "race": "Monster",
      "rarity": "rare",
      "country": "Arcana",
      "lore": "Chad is chad.",
      "image": "art/Rock.webp",
      "id": "expansion1:rock",
      "_expansionId": "expansion1"
    },
    {
      "name": "Taru95",
      "cost": 8,
      "type": "minion",
      "attack": 10,
      "health": 2,
      "keywords": [],
      "race": "Human",
      "rarity": "rare",
      "country": "Germany",
      "lore": "Ich will pöbeln!",
      "image": "art/Taru95.webp",
      "id": "expansion1:taru95",
      "_expansionId": "expansion1"
    },
    {
      "name": "Tucuquere",
      "cost": 5,
      "type": "minion",
      "attack": 7,
      "health": 3,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Chile",
      "lore": "Its watch lasts through the longest night in Arcana.",
      "image": "art/Tucuquere.webp",
      "id": "expansion1:tucuquere",
      "_expansionId": "expansion1"
    },
    {
      "name": "Vlad",
      "cost": 10,
      "type": "minion",
      "attack": 8,
      "health": 4,
      "keywords": [
        "charge"
      ],
      "race": "Human",
      "rarity": "legendary",
      "country": "Cyprus",
      "lore": "𝕳𝖔𝖓𝖔𝖗𝖆𝖇𝖑𝖊.",
      "image": "art/Vlad.webp",
      "id": "expansion1:vlad",
      "_expansionId": "expansion1"
    },
    {
      "name": "Ancalego",
      "cost": 3,
      "type": "minion",
      "attack": 4,
      "health": 3,
      "keywords": [],
      "race": "Monster",
      "rarity": "rare",
      "country": "Finland",
      "lore": "Kwak.",
      "image": "art/Ancalego.webp",
      "id": "expansion2:ancalego",
      "_expansionId": "expansion2"
    },
    {
      "name": "Antichristjesus",
      "cost": 3,
      "type": "minion",
      "attack": 3,
      "health": 5,
      "keywords": [
        "taunt"
      ],
      "race": "Human",
      "rarity": "common",
      "country": "Arcana",
      "lore": "I'm sorry, brothers. So sorry, lover..",
      "image": "art/AntichristJesus.webp",
      "id": "expansion2:antichristjesus",
      "_expansionId": "expansion2"
    },
    {
      "id": "expansion2:Aslani2",
      "name": "Aslani",
      "cost": 6,
      "type": "minion",
      "attack": 4,
      "health": 10,
      "keywords": [],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Belgium",
      "lore": "Empress of Fire and Flame. Whenever this attacks a minion or hero, it applies Burning.",
      "image": "art/Aslani2.webp",
      "abilities": [
        {
          "trigger": "onAttack",
          "effect": "applyBurning",
          "value": 1,
          "turns": 2
        }
      ],
      "_expansionId": "expansion2"
    },
    {
      "name": "Athena",
      "cost": 5,
      "type": "minion",
      "attack": 5,
      "health": 10,
      "keywords": [],
      "race": "Human",
      "rarity": "mythic",
      "country": "Bolivia",
      "lore": "On play, move non-Mythic enemy board minions that can fit to your board. Does not affect Athena cards.",
      "image": "art/Athena.webp",
      "abilities": [
        {
          "trigger": "onPlay",
          "effect": "stealEnemyBoardNonMythicMinions"
        }
      ],
      "id": "expansion2:athena",
      "_expansionId": "expansion2"
    },
    {
      "id": "expansion2:Baatus2",
      "name": "Baatus",
      "cost": 5,
      "type": "minion",
      "attack": 4,
      "health": 10,
      "keywords": [],
      "race": "Human",
      "rarity": "mythic",
      "country": "Netherlands",
      "lore": "While Baatus is on the board, all board minions are Drunk. Drunk minions attack a random minion on either side instead of the chosen target.",
      "image": "art/Baatus2.webp",
      "abilities": [
        {
          "trigger": "passive",
          "effect": "drunkAllMinions"
        }
      ],
      "_expansionId": "expansion2"
    },
    {
      "id": "expansion2:Babu2",
      "name": "Babu",
      "cost": 10,
      "type": "minion",
      "attack": 4,
      "health": 20,
      "keywords": [
        "taunt"
      ],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Belgium",
      "lore": "On play, return your other board minions to your hand. While Babu is on your board, you cannot summon more minions, but you can still cast spells.",
      "image": "art/Babu2.webp",
      "abilities": [
        {
          "trigger": "onPlay",
          "effect": "returnOtherFriendlyMinionsToHand"
        }
      ],
      "_expansionId": "expansion2"
    },
    {
      "name": "Besstrasnyj",
      "cost": 6,
      "type": "minion",
      "attack": 5,
      "health": 7,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Guatemala",
      "lore": "02.05.1945.",
      "image": "art/Besstrasnyj.webp",
      "id": "expansion2:besstrasnyj",
      "_expansionId": "expansion2"
    },
    {
      "name": "Boba",
      "cost": 1,
      "type": "minion",
      "attack": 1,
      "health": 1,
      "keywords": [
        "charge"
      ],
      "race": "Human",
      "rarity": "rare",
      "country": "EEUU",
      "lore": "Yo soy Boba.",
      "image": "art/Boba.webp",
      "id": "expansion2:boba",
      "_expansionId": "expansion2"
    },
    {
      "name": "DaVoskDocta",
      "cost": 5,
      "type": "minion",
      "attack": 4,
      "health": 5,
      "keywords": [
        "divineShield"
      ],
      "race": "Human",
      "rarity": "rare",
      "country": "Poland",
      "lore": "Triplebeam. This card avoids the first hit against him.",
      "image": "art/DaVoskDocta.webp",
      "id": "expansion2:davoskdocta",
      "_expansionId": "expansion2"
    },
    {
      "name": "Franysbel",
      "cost": 8,
      "type": "minion",
      "attack": 6,
      "health": 8,
      "keywords": [
        "taunt"
      ],
      "race": "Human",
      "rarity": "common",
      "country": "Honduras",
      "lore": "Pending final tuning.",
      "image": "art/Franysbel.webp",
      "id": "expansion2:franysbel",
      "_expansionId": "expansion2"
    },
    {
      "name": "High_Inquisitor_KnkL",
      "cost": 3,
      "type": "minion",
      "attack": 0,
      "health": 1,
      "keywords": [],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Vatican",
      "lore": "At the start of each of your turns, this card gains +3/+3.",
      "image": "art/High_Inquisitor_KnkL.webp",
      "abilities": [
        {
          "trigger": "onTurnStart",
          "effect": "buffSelf",
          "attack": 3,
          "health": 3
        }
      ],
      "id": "expansion2:high-inquisitor-knkl",
      "_expansionId": "expansion2"
    },
    {
      "name": "Italo179",
      "cost": 4,
      "type": "minion",
      "attack": 4,
      "health": 6,
      "keywords": [],
      "race": "Human",
      "rarity": "legendary",
      "country": "Brazil",
      "lore": "Takes no damage from Monster cards.",
      "image": "art/Italo179.webp",
      "abilities": [
        {
          "trigger": "passive",
          "effect": "preventDamageFromRace",
          "race": "Monster"
        }
      ],
      "id": "expansion2:italo179",
      "_expansionId": "expansion2"
    },
    {
      "name": "Johnny_Sins",
      "cost": 5,
      "type": "minion",
      "attack": 3,
      "health": 8,
      "keywords": [],
      "race": "Human",
      "rarity": "rare",
      "country": "Sierra Leone",
      "lore": "Until the end...",
      "image": "art/Johnny_Sins.webp",
      "id": "expansion2:johnny-sins",
      "_expansionId": "expansion2"
    },
    {
      "name": "Knud_the_Dorf",
      "cost": 4,
      "type": "minion",
      "attack": 4,
      "health": 6,
      "keywords": [],
      "race": "Monster",
      "rarity": "legendary",
      "country": "Denmark",
      "lore": "Takes no damage from Human cards.",
      "image": "art/Knud_the_Dorf.webp",
      "abilities": [
        {
          "trigger": "passive",
          "effect": "preventDamageFromRace",
          "race": "Human"
        }
      ],
      "id": "expansion2:knud-the-dorf",
      "_expansionId": "expansion2"
    },
    {
      "name": "Lawrence-of-Arabia",
      "cost": 6,
      "type": "minion",
      "attack": 2,
      "health": 12,
      "keywords": [],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Yemen",
      "lore": "At the start of each of your turns, add a random spell card to your hand.",
      "image": "art/Lawrence-of-Arabia.webp",
      "abilities": [
        {
          "trigger": "onTurnStart",
          "effect": "addRandomSpellToHand"
        }
      ],
      "id": "expansion2:lawrence-of-arabia",
      "_expansionId": "expansion2"
    },
    {
      "name": "LoneViking",
      "cost": 7,
      "type": "minion",
      "attack": 4,
      "health": 5,
      "keywords": [
        "charge"
      ],
      "race": "Human",
      "rarity": "common",
      "country": "Arcana",
      "lore": "Pending final tuning.",
      "image": "art/LoneViking.webp",
      "id": "expansion2:loneviking",
      "_expansionId": "expansion2"
    },
    {
      "name": "Michiel_op_Snuifari",
      "cost": 1,
      "type": "minion",
      "attack": 1,
      "health": 1,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Arcana",
      "lore": "While this is on your board, allied minions that die afterward revive with 1 Health and half their Attack. This does not affect Michiel_op_Snuifari.",
      "image": "art/Michiel_op_Snuifari.webp",
      "abilities": [
        {
          "trigger": "passive",
          "effect": "reviveOtherFriendlyMinions"
        }
      ],
      "id": "expansion2:michiel-op-snuifari",
      "_expansionId": "expansion2"
    },
    {
      "name": "Trajano",
      "cost": 1,
      "type": "minion",
      "attack": 2,
      "health": 2,
      "keywords": [
        "taunt"
      ],
      "race": "Human",
      "rarity": "common",
      "country": "Spain",
      "lore": "Pending final tuning.",
      "image": "art/Trajano.webp",
      "id": "expansion2:trajano",
      "_expansionId": "expansion2"
    },
    {
      "name": "Vatou",
      "cost": 3,
      "type": "minion",
      "attack": 3,
      "health": 5,
      "keywords": [],
      "race": "Human",
      "rarity": "souvenir",
      "country": "Arcana",
      "lore": "Batata.",
      "image": "art/Vatou.webp",
      "id": "expansion2:vatou",
      "_expansionId": "expansion2"
    },
    {
      "name": "Weekly_Wackadoo",
      "cost": 6,
      "type": "minion",
      "attack": 6,
      "health": 6,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Netherlands",
      "lore": "De aartsvader van de YOLO.",
      "image": "art/Weekly_Wackadoo.webp",
      "id": "expansion2:weekly-wackadoo",
      "_expansionId": "expansion2"
    },
    {
      "name": "XiaoMao",
      "cost": 9,
      "type": "minion",
      "attack": 5,
      "health": 10,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Bolivia",
      "lore": "Pending final tuning.",
      "image": "art/XiaoMao.webp",
      "id": "expansion2:xiaomao",
      "_expansionId": "expansion2"
    },
    {
      "name": "ArchMoth_Morlet",
      "cost": 7,
      "type": "minion",
      "attack": 2,
      "health": 7,
      "keywords": [],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Vatican",
      "lore": "I send moths! When summoned, this card spawns 2 special Moths cards.",
      "image": "art/ArchMoth_Morlet.webp",
      "abilities": [
        {
          "trigger": "onPlay",
          "effect": "summonMinion",
          "cardId": "special:moths",
          "count": 2
        }
      ],
      "id": "TheGates:archmoth-morlet",
      "_expansionId": "TheGates"
    },
    {
      "name": "Cardinal Severin",
      "cost": 7,
      "type": "minion",
      "attack": 3,
      "health": 13,
      "keywords": [
        "taunt"
      ],
      "race": "Human",
      "rarity": "mythic",
      "country": "Thailand",
      "lore": "On play, silence an enemy minion. A wall of doctrine against any engine.",
      "image": "art/Cardinal_Severin.webp",
      "abilities": [
        {
          "trigger": "onPlay",
          "effect": "applyStatus",
          "target": "enemyMinion",
          "status": "silenced"
        }
      ],
      "id": "TheGates:cardinal-severin",
      "_expansionId": "TheGates"
    },
    {
      "name": "Chiorico",
      "cost": 5,
      "type": "minion",
      "attack": 4,
      "health": 10,
      "keywords": [],
      "race": "Human",
      "rarity": "mythic",
      "country": "Malta",
      "lore": "On play, mark an enemy minion for 3 turns. The next strike against it hits harder.",
      "image": "art/chiorico.webp",
      "abilities": [
        {
          "trigger": "onPlay",
          "effect": "applyStatus",
          "target": "enemyMinion",
          "status": "marked",
          "value": 3,
          "turns": 2
        }
      ],
      "id": "TheGates:chiorico",
      "_expansionId": "TheGates"
    },
    {
      "name": "Jacque De Balsac",
      "cost": 5,
      "type": "minion",
      "attack": 4,
      "health": 10,
      "keywords": [],
      "race": "Human",
      "rarity": "mythic",
      "country": "Belgium",
      "lore": "On play, freeze an enemy minion before its next assault.",
      "image": "art/JacqueDeBalsac.webp",
      "abilities": [
        {
          "trigger": "onPlay",
          "effect": "applyStatus",
          "target": "enemyMinion",
          "status": "frozen",
          "turns": 1
        }
      ],
      "id": "TheGates:jacquedebalsac",
      "_expansionId": "TheGates"
    },
    {
      "name": "Kep",
      "cost": 8,
      "type": "minion",
      "attack": 2,
      "health": 15,
      "keywords": [],
      "race": "Human",
      "rarity": "mythic",
      "country": "Portugal",
      "lore": "Uzbekistan sympathizer. This card regenerates one of health on your side every turn.",
      "image": "art/Keps.webp",
      "abilities": [
        {
          "trigger": "onTurnStart",
          "effect": "healAllFriendlyMinions",
          "value": 1
        }
      ],
      "id": "TheGates:kep",
      "_expansionId": "TheGates"
    },
    {
      "name": "Mamaluteo",
      "cost": 7,
      "type": "minion",
      "attack": 5,
      "health": 10,
      "keywords": [],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Bolivia",
      "lore": "On play, poison an enemy minion or hero for six turns. Poison deals +2 damage.",
      "image": "art/mamaluteo.webp",
      "abilities": [
        {
          "trigger": "onPlay",
          "effect": "applyStatus",
          "target": "enemy",
          "status": "poisoned",
          "value": 2,
          "turns": 6
        }
      ],
      "id": "TheGates:mamaluteo",
      "_expansionId": "TheGates"
    },
    {
      "name": "Overseer",
      "cost": 3,
      "type": "minion",
      "attack": 4,
      "health": 6,
      "keywords": [],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Oman",
      "lore": "On its first death, deal 20 damage to all minions, then return with 1 Health.",
      "image": "art/Overseer.webp",
      "abilities": [
        {
          "trigger": "onDeath",
          "effect": "damageAllMinions",
          "value": 20,
          "firstDeathOnly": true
        },
        {
          "trigger": "onDeath",
          "effect": "rebirthWithHealth",
          "value": 1
        }
      ],
      "id": "TheGates:overseer",
      "_expansionId": "TheGates"
    },
    {
      "name": "Toy",
      "cost": 5,
      "type": "minion",
      "attack": 5,
      "health": 10,
      "keywords": [],
      "race": "Human",
      "rarity": "mythic",
      "country": "Portugal",
      "lore": "On play, weaken an enemy minion for two turns.",
      "image": "art/Toy.webp",
      "abilities": [
        {
          "trigger": "onPlay",
          "effect": "applyStatus",
          "target": "enemyMinion",
          "status": "weakened",
          "value": 3,
          "turns": 2
        }
      ],
      "id": "TheGates:toy",
      "_expansionId": "TheGates"
    },
    {
      "name": "Unwnmas",
      "cost": 6,
      "type": "minion",
      "attack": 3,
      "health": 7,
      "keywords": [
        "charge"
      ],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Chile",
      "lore": "Whenever this attacks a minion or the enemy hero, deal 3 damage to the enemy hero. This card can instantly attack when prepared.",
      "image": "art/Unwnmas.webp",
      "abilities": [
        {
          "trigger": "onAttack",
          "effect": "damageEnemyHero",
          "value": 3
        }
      ],
      "id": "TheGates:unwnmas",
      "_expansionId": "TheGates"
    },
    {
      "name": "Zoblezar",
      "cost": 10,
      "type": "minion",
      "attack": 8,
      "health": 10,
      "keywords": [],
      "race": "Human",
      "rarity": "mythic",
      "country": "Uzbekistan",
      "lore": "The first time this card dies, revive it with half of its maximum Health.",
      "image": "art/Zoblezar.webp",
      "abilities": [
        {
          "trigger": "onDeath",
          "effect": "rebirthWithHalfHealth"
        }
      ],
      "id": "TheGates:zoblezar",
      "_expansionId": "TheGates"
    },
    {
      "name": "Aleex",
      "cost": 2,
      "type": "minion",
      "attack": 2,
      "health": 4,
      "keywords": [],
      "race": "Monster",
      "rarity": "common",
      "country": "Bolivia",
      "lore": "Probably not Bolivian. This weird bird wants to catch you instead.",
      "image": "art/Aleex.webp",
      "id": "base:aleex",
      "_expansionId": "base"
    },
    {
      "name": "Alfred Longstocking",
      "cost": 5,
      "type": "minion",
      "attack": 2,
      "health": 8,
      "keywords": [
        "taunt"
      ],
      "race": "Human",
      "rarity": "rare",
      "country": "Sweden",
      "lore": "A mighty tank to carry others!. This card has attack priority above all.",
      "image": "art/Alfred-Longstocking.webp",
      "id": "base:alfred-longstocking",
      "_expansionId": "base"
    },
    {
      "name": "Angel",
      "cost": 6,
      "type": "minion",
      "attack": 7,
      "health": 5,
      "keywords": [],
      "race": "Monster",
      "rarity": "rare",
      "country": "South Korea",
      "lore": "Do not be afraid.",
      "image": "art/Angel.webp",
      "id": "base:angel",
      "_expansionId": "base"
    },
    {
      "name": "ArchbishopMaximilian",
      "cost": 3,
      "type": "minion",
      "attack": 2,
      "health": 5,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Ukraine",
      "lore": "A mighty soldier ready for everything.",
      "image": "art/ArchbishopMaximilian.webp",
      "id": "base:archbishopmaximilian",
      "_expansionId": "base"
    },
    {
      "name": "Babu",
      "cost": 9,
      "type": "minion",
      "attack": 2,
      "health": 10,
      "keywords": [
        "taunt"
      ],
      "race": "Monster",
      "rarity": "rare",
      "country": "Belgium",
      "lore": "Mods mute Babu please. This card has attack priority above all",
      "image": "art/Babu.webp",
      "id": "base:babu",
      "_expansionId": "base"
    },
    {
      "name": "Barto",
      "cost": 4,
      "type": "minion",
      "attack": 2,
      "health": 6,
      "keywords": [
        "taunt"
      ],
      "race": "Monster",
      "rarity": "common",
      "country": "Sierra Leone",
      "lore": "Sierra Leone biggest tank. This card has attack priority above all.",
      "image": "art/Barto.webp",
      "id": "base:barto",
      "_expansionId": "base"
    },
    {
      "name": "Beitsas",
      "cost": 2,
      "type": "minion",
      "attack": 2,
      "health": 2,
      "keywords": [
        "charge"
      ],
      "race": "Monster",
      "rarity": "common",
      "country": "Lithuania",
      "lore": "It's time to end this. This card can instantly attack when prepared.",
      "image": "art/Beitsas.webp",
      "id": "base:beitsas",
      "_expansionId": "base"
    },
    {
      "name": "Bloodgiver",
      "cost": 5,
      "type": "minion",
      "attack": 4,
      "health": 6,
      "keywords": [],
      "race": "Human",
      "rarity": "legendary",
      "country": "Poland",
      "lore": "The mighty powerful. This card heals itself by 2 every time it attacks.",
      "image": "art/Bloodgiver.webp",
      "abilities": [
        {
          "trigger": "onAttackMinion",
          "effect": "healSelf",
          "value": 2
        }
      ],
      "id": "base:bloodgiver",
      "_expansionId": "base"
    },
    {
      "name": "Bogoljub",
      "cost": 1,
      "type": "minion",
      "attack": 1,
      "health": 4,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Serbia",
      "lore": "Croatia biggest nightmare.",
      "image": "art/Bogoljub.webp",
      "id": "base:bogoljub",
      "_expansionId": "base"
    },
    {
      "name": "Capybara",
      "cost": 3,
      "type": "minion",
      "attack": 3,
      "health": 1,
      "keywords": [
        "charge"
      ],
      "race": "Monster",
      "rarity": "common",
      "country": "Argentina",
      "lore": "The Capy.",
      "image": "art/Capybara.webp",
      "id": "base:capybara",
      "_expansionId": "base"
    },
    {
      "name": "Cassie21",
      "cost": 1,
      "type": "minion",
      "attack": 2,
      "health": 3,
      "keywords": [],
      "race": "Human",
      "rarity": "rare",
      "country": "Portugal",
      "lore": "This is Cassie21 card, hello Cassie.",
      "image": "art/Cassie21.webp",
      "id": "base:cassie21",
      "_expansionId": "base"
    },
    {
      "name": "Dezadin",
      "cost": 6,
      "type": "minion",
      "attack": 3,
      "health": 4,
      "keywords": [],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Bolivia",
      "lore": "You’re made of spare parts, aren’t you, bud?. This card buffs all already summoned cards by +2",
      "image": "art/Dezadin.webp",
      "abilities": [
        {
          "trigger": "onPlay",
          "effect": "buffAllFriendlyMinions",
          "attack": 2,
          "health": 2
        }
      ],
      "id": "base:dezadin",
      "_expansionId": "base"
    },
    {
      "name": "DisappointmentPanda",
      "cost": 4,
      "type": "minion",
      "attack": 4,
      "health": 4,
      "keywords": [
        "taunt"
      ],
      "race": "Monster",
      "rarity": "common",
      "country": "India",
      "lore": "A Heavy Panda for heavy situations. This card has attack priority above all.",
      "image": "art/DisappointmentPanda.webp",
      "id": "base:disappointmentpanda",
      "_expansionId": "base"
    },
    {
      "name": "Dog",
      "cost": 5,
      "type": "minion",
      "attack": 3,
      "health": 5,
      "keywords": [
        "charge"
      ],
      "race": "Monster",
      "rarity": "rare",
      "country": "South Africa",
      "lore": "This card can instantly attack when prepared.",
      "image": "art/Dog.webp",
      "id": "base:dog",
      "_expansionId": "base"
    },
    {
      "name": "Eraserhead",
      "cost": 5,
      "type": "minion",
      "attack": 4,
      "health": 7,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Sierra Leone",
      "lore": "He might not be able to talk, but he's able to fight.",
      "image": "art/Eraserhead.webp",
      "id": "base:eraserhead",
      "_expansionId": "base"
    },
    {
      "name": "Fish",
      "cost": 6,
      "type": "minion",
      "attack": 3,
      "health": 7,
      "keywords": [
        "taunt"
      ],
      "race": "Monster",
      "rarity": "rare",
      "country": "Vanuatu",
      "lore": "A horror on the sea. This card has attack priority above all.",
      "image": "art/Fish.webp",
      "id": "base:fish",
      "_expansionId": "base"
    },
    {
      "name": "Gabibbo Ardito",
      "cost": 6,
      "type": "minion",
      "attack": 2,
      "health": 7,
      "keywords": [
        "charge"
      ],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Italy",
      "lore": "Corruption is only bad if I am not involved. At the start of your turn, clone this card.",
      "image": "art/Gabibbo_Ardito.webp",
      "abilities": [
        {
          "trigger": "onTurnStart",
          "effect": "summonMinion",
          "cardId": "base:gabibbo-ardito",
          "count": 1
        }
      ],
      "id": "base:gabibbo-ardito",
      "_expansionId": "base"
    },
    {
      "name": "Galileo Gunplay",
      "cost": 5,
      "type": "minion",
      "attack": 5,
      "health": 6,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Solomon Islands",
      "lore": "No mo pain, it's all gone.",
      "image": "art/Galileo-Gunplay.webp",
      "id": "base:galileo-gunplay",
      "_expansionId": "base"
    },
    {
      "name": "GoldenWarerita",
      "cost": 4,
      "type": "minion",
      "attack": 3,
      "health": 8,
      "keywords": [],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Arcana",
      "lore": "When this card dies, transform it into a normal Warerita on the board.",
      "image": "art/GoldenWarerita.webp",
      "abilities": [
        {
          "trigger": "onDeath",
          "effect": "transformIntoMinion",
          "cardId": "base:warerita"
        }
      ],
      "id": "base:goldenwarerita",
      "_expansionId": "base"
    },
    {
      "name": "Hazzard",
      "cost": 5,
      "type": "minion",
      "attack": 4,
      "health": 1,
      "keywords": [
        "charge"
      ],
      "race": "Human",
      "rarity": "common",
      "country": "Iceland",
      "lore": "Try again. Fail again. Fail better. This card can instantly attack when prepared.",
      "image": "art/Hazzard.webp",
      "id": "base:hazzard",
      "_expansionId": "base"
    },
    {
      "name": "Humph",
      "cost": 5,
      "type": "minion",
      "attack": 8,
      "health": 10,
      "keywords": [],
      "race": "Human",
      "rarity": "mythic",
      "country": "Ireland",
      "lore": "When this card dies, return every remaining minion on both boards to its owner's deck.",
      "image": "art/Humph.webp",
      "abilities": [
        {
          "trigger": "onDeath",
          "effect": "returnAllMinionsToDeck"
        }
      ],
      "id": "base:humph",
      "_expansionId": "base"
    },
    {
      "name": "Jakal",
      "cost": 7,
      "type": "minion",
      "attack": 2,
      "health": 11,
      "keywords": [],
      "race": "Monster",
      "rarity": "legendary",
      "country": "Portugal",
      "lore": "The mighty god, when this card it's prepared, it will deal 1 of damage to every card of the board.",
      "image": "art/Jakal.webp",
      "abilities": [
        {
          "trigger": "onAnyTurnStart",
          "effect": "damageAllMinions",
          "value": 1
        }
      ],
      "id": "base:jakal",
      "_expansionId": "base"
    },
    {
      "name": "Juniiya",
      "cost": 7,
      "type": "minion",
      "attack": 6,
      "health": 6,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Netherlands",
      "lore": "Opportunities multiply as they are seized.",
      "image": "art/Juniiya.webp",
      "id": "base:juniiya",
      "_expansionId": "base"
    },
    {
      "name": "Kep",
      "cost": 1,
      "type": "minion",
      "attack": 1,
      "health": 5,
      "keywords": [],
      "race": "Human",
      "rarity": "rare",
      "country": "Portugal",
      "lore": "Can you make my card the strongest in the game? thanks.",
      "image": "art/Kep.webp",
      "id": "base:kep",
      "_expansionId": "base"
    },
    {
      "name": "Kurzemnieks",
      "cost": 3,
      "type": "minion",
      "attack": 2,
      "health": 5,
      "keywords": [
        "charge"
      ],
      "race": "Human",
      "rarity": "rare",
      "country": "Latvia",
      "lore": "This card can instantly attack when prepared.",
      "image": "art/Kurzemnieks.webp",
      "id": "base:kurzemnieks",
      "_expansionId": "base"
    },
    {
      "name": "Kysely",
      "cost": 5,
      "type": "minion",
      "attack": 2,
      "health": 9,
      "keywords": [],
      "race": "Monster",
      "rarity": "common",
      "country": "Czechia",
      "lore": "Kysely.",
      "image": "art/Kysely.webp",
      "id": "base:kysely",
      "_expansionId": "base"
    },
    {
      "name": "Laucha",
      "cost": 4,
      "type": "minion",
      "attack": 4,
      "health": 5,
      "keywords": [],
      "race": "Monster",
      "rarity": "common",
      "country": "Chile",
      "lore": "\"Finish every day and be done with it.\"",
      "image": "art/Laucha.webp",
      "id": "base:laucha",
      "_expansionId": "base"
    },
    {
      "name": "Lifelinker",
      "cost": 9,
      "type": "minion",
      "attack": 8,
      "health": 8,
      "keywords": [],
      "race": "Monster",
      "rarity": "common",
      "country": "Uzbekistan",
      "lore": "Uzbekistan lover.",
      "image": "art/Lifelinker.webp",
      "id": "base:lifelinker",
      "_expansionId": "base"
    },
    {
      "name": "Lolflame",
      "cost": 4,
      "type": "minion",
      "attack": 2,
      "health": 5,
      "keywords": [
        "charge"
      ],
      "race": "Monster",
      "rarity": "common",
      "country": "Djibouti",
      "lore": "The strong and silent type. This card can instantly attack when prepared.",
      "image": "art/Lolflame.webp",
      "id": "base:lolflame",
      "_expansionId": "base"
    },
    {
      "name": "Lolflame",
      "cost": 4,
      "type": "minion",
      "attack": 3,
      "health": 5,
      "keywords": [
        "charge"
      ],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Djibouti",
      "lore": "Charge. Whenever this attacks, deal 1 damage to all enemy minions.",
      "image": "art/Lolflames.webp",
      "abilities": [
        {
          "trigger": "onAttack",
          "effect": "damageAllEnemyMinions",
          "value": 1
        }
      ],
      "id": "base:lolflame2",
      "_expansionId": "base"
    },
    {
      "name": "Miyabi",
      "cost": 2,
      "type": "minion",
      "attack": 1,
      "health": 6,
      "keywords": [],
      "race": "Monster",
      "rarity": "common",
      "country": "Romania",
      "lore": "Foreigner.",
      "image": "art/Miyabi.webp",
      "id": "base:miyabi",
      "_expansionId": "base"
    },
    {
      "name": "Mostor",
      "cost": 6,
      "type": "minion",
      "attack": 3,
      "health": 7,
      "keywords": [
        "charge"
      ],
      "race": "Monster",
      "rarity": "legendary",
      "country": "Egypt",
      "lore": "After dying, this card returns to the deck. This card can instantly attack when prepared.",
      "image": "art/Mostor.webp",
      "abilities": [
        {
          "trigger": "onDeath",
          "effect": "returnToDeckIfPlayedLessThan",
          "value": 2
        }
      ],
      "id": "base:mostor",
      "_expansionId": "base"
    },
    {
      "name": "Mr Labubu",
      "cost": 5,
      "type": "minion",
      "attack": 7,
      "health": 2,
      "keywords": [],
      "race": "Monster",
      "rarity": "rare",
      "country": "Germany",
      "lore": "I am the greatest Labubu.",
      "image": "art/Mr_Labubu.webp",
      "id": "base:mr-labubu",
      "_expansionId": "base"
    },
    {
      "name": "Multimaker",
      "cost": 7,
      "type": "minion",
      "attack": 1,
      "health": 8,
      "keywords": [],
      "race": "Human",
      "rarity": "legendary",
      "country": "Arcana",
      "lore": "Has no flag, but always a plan B. At the start of your turn, summon a Multi.",
      "image": "art/Multimaker.webp",
      "abilities": [
        {
          "trigger": "onTurnStart",
          "effect": "summonMinion",
          "cardId": "special:multi",
          "count": 1
        }
      ],
      "id": "base:multimaker",
      "_expansionId": "base"
    },
    {
      "name": "Naruto",
      "cost": 4,
      "type": "minion",
      "attack": 3,
      "health": 6,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Venezuela",
      "lore": "Omg Naruto.",
      "image": "art/Naruto.webp",
      "id": "base:naruto",
      "_expansionId": "base"
    },
    {
      "name": "NiNa",
      "cost": 1,
      "type": "minion",
      "attack": 0,
      "health": 5,
      "keywords": [
        "taunt"
      ],
      "race": "Monster",
      "rarity": "common",
      "country": "United Kingdom",
      "lore": "I can't take Irish banter",
      "image": "art/NiNa.webp",
      "id": "base:nina",
      "_expansionId": "base"
    },
    {
      "name": "Oil Bert",
      "cost": 5,
      "type": "minion",
      "attack": 4,
      "health": 6,
      "keywords": [],
      "race": "Human",
      "rarity": "rare",
      "country": "Germany",
      "lore": "Bring back oil.",
      "image": "art/Oil-Bert.webp",
      "id": "base:oil-bert",
      "_expansionId": "base"
    },
    {
      "name": "Penquin",
      "cost": 4,
      "type": "minion",
      "attack": 3,
      "health": 6,
      "keywords": [],
      "race": "Monster",
      "rarity": "legendary",
      "country": "New Zealand",
      "lore": "This card deals +2 damage to Human cards.",
      "image": "art/Penquin.webp",
      "damageBonuses": [
        {
          "race": "Human",
          "value": 2
        }
      ],
      "id": "base:penquin",
      "_expansionId": "base"
    },
    {
      "name": "Piraterer",
      "cost": 10,
      "type": "minion",
      "attack": 5,
      "health": 12,
      "keywords": [],
      "race": "Human",
      "rarity": "rare",
      "country": "Japan",
      "lore": "Dont mess with my fans! Put Bounty!.",
      "image": "art/Piraterer.webp",
      "id": "base:piraterer",
      "_expansionId": "base"
    },
    {
      "name": "PrinceMVC",
      "cost": 10,
      "type": "minion",
      "attack": 3,
      "health": 14,
      "keywords": [
        "taunt"
      ],
      "race": "Human",
      "rarity": "rare",
      "country": "Nigeria",
      "lore": "The real Nigerian King. This card has attack priority above all.",
      "image": "art/PrinceMVC.webp",
      "id": "base:princemvc",
      "_expansionId": "base"
    },
    {
      "name": "Radu",
      "cost": 4,
      "type": "minion",
      "attack": 3,
      "health": 6,
      "keywords": [],
      "race": "Human",
      "rarity": "legendary",
      "country": "Romania",
      "lore": "jocu asta mi-a mancat toti nervii. This card deals +2 damage to monsters.",
      "image": "art/Radu.webp",
      "damageBonuses": [
        {
          "race": "Monster",
          "value": 2
        }
      ],
      "id": "base:radu",
      "_expansionId": "base"
    },
    {
      "name": "Ranger",
      "cost": 9,
      "type": "minion",
      "attack": 7,
      "health": 9,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Chile",
      "lore": "Be the one who removes the stone from the path.",
      "image": "art/Ranger.webp",
      "id": "base:ranger",
      "_expansionId": "base"
    },
    {
      "name": "Rin",
      "cost": 7,
      "type": "minion",
      "attack": 6,
      "health": 8,
      "keywords": [],
      "race": "Human",
      "rarity": "rare",
      "country": "Malaysia",
      "lore": "The strong arm of Malaysia.",
      "image": "art/Rin.webp",
      "id": "base:rin",
      "_expansionId": "base"
    },
    {
      "name": "RotiLapis",
      "cost": 8,
      "type": "minion",
      "attack": 6,
      "health": 3,
      "keywords": [
        "charge"
      ],
      "race": "Human",
      "rarity": "rare",
      "country": "Indonesia",
      "lore": "This card can instantly attack when prepared.",
      "image": "art/RotiLapis.webp",
      "id": "base:rotilapis",
      "_expansionId": "base"
    },
    {
      "name": "SAVOIARDO",
      "cost": 5,
      "type": "minion",
      "attack": 3,
      "health": 8,
      "keywords": [],
      "race": "Monster",
      "rarity": "common",
      "country": "Italy",
      "lore": "Avanti Savoiardi!.",
      "image": "art/SAVOIARDO.webp",
      "id": "base:savoiardo",
      "_expansionId": "base"
    },
    {
      "name": "Saaaru",
      "cost": 7,
      "type": "minion",
      "attack": 5,
      "health": 8,
      "keywords": [
        "taunt"
      ],
      "race": "Human",
      "rarity": "common",
      "country": "Chile",
      "lore": "Non nobis domine, sed nomini tuo da gloriam. This card has attack priority above all.",
      "image": "art/Saaaru.webp",
      "id": "base:saaaru",
      "_expansionId": "base"
    },
    {
      "name": "Slandah al Shuja",
      "cost": 2,
      "type": "minion",
      "attack": 2,
      "health": 4,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Yemen",
      "lore": "The mind behind Yemen.",
      "image": "art/Slandah-al-Shuja.webp",
      "id": "base:slandah-al-shuja",
      "_expansionId": "base"
    },
    {
      "name": "StormHazard",
      "cost": 6,
      "type": "minion",
      "attack": 1,
      "health": 9,
      "keywords": [
        "charge"
      ],
      "race": "Monster",
      "rarity": "common",
      "country": "South Africa",
      "lore": "The storm it's coming.",
      "image": "art/StormHazard.webp",
      "id": "base:stormhazard",
      "_expansionId": "base"
    },
    {
      "name": "SzczwanyLisek",
      "cost": 5,
      "type": "minion",
      "attack": 5,
      "health": 5,
      "keywords": [],
      "race": "Monster",
      "rarity": "rare",
      "country": "Poland",
      "lore": "CEO of Anti Sweden Social Club.",
      "image": "art/SzczwanyLisek.webp",
      "id": "base:szczwanylisek",
      "_expansionId": "base"
    },
    {
      "name": "Sturmwehr",
      "cost": 1,
      "type": "minion",
      "attack": 1,
      "health": 4,
      "keywords": [
        "taunt"
      ],
      "race": "Human",
      "rarity": "common",
      "country": "Austria",
      "lore": "One day we meet in Valhalla. This card has attack priority above all.",
      "image": "art/Sturmwehr.webp",
      "id": "base:turmwehr",
      "_expansionId": "base"
    },
    {
      "name": "User",
      "cost": 0,
      "type": "minion",
      "attack": 1,
      "health": 1,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Arcana",
      "lore": "Just a generic user.",
      "image": "art/User.webp",
      "id": "base:user",
      "_expansionId": "base"
    },
    {
      "name": "V for Vendetta",
      "cost": 4,
      "type": "minion",
      "attack": 3,
      "health": 6,
      "keywords": [
        "taunt"
      ],
      "race": "Human",
      "rarity": "rare",
      "country": "Lithuania",
      "lore": "This card has attack priority above all.",
      "image": "art/V_for_Vendetta.webp",
      "id": "base:v-for-vendetta",
      "_expansionId": "base"
    },
    {
      "name": "Vergil",
      "cost": 2,
      "type": "minion",
      "attack": 1,
      "health": 7,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Spain",
      "lore": "Why tomboys are better than femboys?.",
      "image": "art/Vergil.webp",
      "id": "base:vergil",
      "_expansionId": "base"
    },
    {
      "name": "Warerita",
      "cost": 3,
      "type": "minion",
      "attack": 3,
      "health": 4,
      "keywords": [],
      "race": "Monster",
      "rarity": "rare",
      "country": "Arcana",
      "lore": "Wareritaaaa.",
      "image": "art/Warerita.webp",
      "id": "base:warerita",
      "_expansionId": "base"
    },
    {
      "name": "Zugzwang",
      "cost": 6,
      "type": "minion",
      "attack": 5,
      "health": 7,
      "keywords": [
        "charge"
      ],
      "race": "Human",
      "rarity": "mythic",
      "country": "Bolivia",
      "lore": "At the start of each of your turns, add a Minor Spark to your hand. This card can instantly attack when prepared.",
      "image": "art/Zugzwang.webp",
      "abilities": [
        {
          "trigger": "onTurnStart",
          "effect": "addCardToHand",
          "cardId": "expansion1:minorspark"
        }
      ],
      "id": "base:zugzwang",
      "_expansionId": "base"
    },
    {
      "name": "TheUnchained",
      "cost": 6,
      "attack": 0,
      "health": 20,
      "type": "minion",
      "rarity": "mythic",
      "country": "Arcana",
      "race": "Construct",
      "keywords": [],
      "image": "art/TheUnchained.webp",
      "showInInventory": false,
      "lore": "An encounter-only boss. Its presence calls the shield trial.",
      "id": "campaign2:iron-sentinel",
      "_expansionId": "campaign2"
    },
    {
      "name": "Mana Spark",
      "cost": 0,
      "type": "spell",
      "rarity": "common",
      "country": "Arcana",
      "lore": "Gain 1 temporary Mana this turn.",
      "image": "art/MinorSpark.webp",
      "showInInventory": false,
      "abilities": [
        {
          "trigger": "onPlay",
          "effect": "gainTemporaryMana",
          "value": 1
        }
      ],
      "id": "special:manaspark",
      "_expansionId": "special"
    },
    {
      "name": "Moths",
      "cost": 5,
      "type": "minion",
      "attack": 2,
      "health": 3,
      "keywords": [],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Arcana",
      "lore": "A moth! Every turn this card heals your board by 2!",
      "image": "art/Moths.webp",
      "showInInventory": false,
      "abilities": [
        {
          "trigger": "onTurnStart",
          "effect": "buffAllFriendlyMinions",
          "health": 2
        }
      ],
      "id": "special:moths",
      "_expansionId": "special"
    },
    {
      "name": "Multi",
      "cost": 1,
      "type": "minion",
      "attack": 2,
      "health": 1,
      "keywords": [],
      "race": "Monster",
      "rarity": "rare",
      "country": "Arcana",
      "lore": "This is a multi, kill it!.",
      "image": "art/Multi.webp",
      "showInInventory": false,
      "id": "special:multi",
      "_expansionId": "special"
    },
    {
      "name": "RedWolf",
      "cost": 5,
      "type": "minion",
      "attack": 5,
      "health": 6,
      "keywords": [
        "taunt"
      ],
      "race": "Monster",
      "rarity": "rare",
      "country": "Arcana",
      "lore": "Red's loyal guardian holds the line until the next call.",
      "image": "art/RedWolf.webp",
      "showInInventory": false,
      "id": "special:redwolf",
      "_expansionId": "special"
    }
  ];

  function getCardById(id) {
    return CARDS.find((c) => c.id === id);
  }

  // Starter deck: 1 copy of each enabled card in expansions/.
  function buildStarterDeck() {
    return CARDS.map((c) => c.id);
  }

  return { CARDS, getCardById, buildStarterDeck };
});
