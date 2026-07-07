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
      "name": "Aleex",
      "cost": 3,
      "type": "minion",
      "attack": 2,
      "health": 3,
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
      "cost": 4,
      "type": "minion",
      "attack": 1,
      "health": 10,
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
      "rarity": "legendary",
      "country": "South Korea",
      "lore": "Do not be afraid.",
      "image": "art/Angel.webp",
      "id": "base:angel",
      "_expansionId": "base"
    },
    {
      "name": "ArchbishopMaximilian",
      "cost": 4,
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
      "cost": 6,
      "type": "minion",
      "attack": 3,
      "health": 11,
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
      "cost": 2,
      "type": "minion",
      "attack": 2,
      "health": 4,
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
      "attack": 3,
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
      "attack": 3,
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
      "health": 3,
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
      "health": 4,
      "keywords": [],
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
      "health": 2,
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
      "name": "DisappointmentPanda",
      "cost": 3,
      "type": "minion",
      "attack": 2,
      "health": 6,
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
      "cost": 3,
      "type": "minion",
      "attack": 3,
      "health": 5,
      "keywords": [
        "charge"
      ],
      "race": "Unknown",
      "rarity": "rare",
      "country": "South Africa",
      "lore": "Ok Dog your card it's broken. This card can instantly attack when prepared.",
      "image": "art/Dog.webp",
      "id": "base:dog",
      "_expansionId": "base"
    },
    {
      "name": "Eraserhead",
      "cost": 4,
      "type": "minion",
      "attack": 3,
      "health": 5,
      "keywords": [],
      "race": "human",
      "rarity": "common",
      "country": "Sierra Leone",
      "lore": "He might not be able to talk, but he's able to fight.",
      "image": "art/Eraserhead.webp",
      "id": "base:eraserhead",
      "_expansionId": "base"
    },
    {
      "name": "Fish",
      "cost": 5,
      "type": "minion",
      "attack": 3,
      "health": 8,
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
      "cost": 1,
      "type": "minion",
      "attack": 1,
      "health": 4,
      "keywords": [],
      "race": "Monster",
      "rarity": "rare",
      "country": "Italy",
      "lore": "Corruption is only bad if I am not involved.",
      "image": "art/Gabibbo_Ardito.webp",
      "id": "base:gabibbo-ardito",
      "_expansionId": "base"
    },
    {
      "name": "Galileo Gunplay",
      "cost": 3,
      "type": "minion",
      "attack": 3,
      "health": 4,
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
      "name": "Hazzard",
      "cost": 4,
      "type": "minion",
      "attack": 5,
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
      "name": "Jakal",
      "cost": 7,
      "type": "minion",
      "attack": 1,
      "health": 12,
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
      "cost": 8,
      "type": "minion",
      "attack": 8,
      "health": 5,
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
      "health": 2,
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
      "cost": 2,
      "type": "minion",
      "attack": 2,
      "health": 4,
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
      "cost": 9,
      "type": "minion",
      "attack": 2,
      "health": 8,
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
      "cost": 3,
      "type": "minion",
      "attack": 3,
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
      "cost": 10,
      "type": "minion",
      "attack": 8,
      "health": 8,
      "keywords": [],
      "race": "Unknown",
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
      "health": 6,
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
      "name": "Miyabi",
      "cost": 2,
      "type": "minion",
      "attack": 1,
      "health": 4,
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
      "cost": 4,
      "type": "minion",
      "attack": 2,
      "health": 6,
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
      "attack": 3,
      "health": 5,
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
      "health": 9,
      "keywords": [],
      "race": "Human",
      "rarity": "legendary",
      "country": "Arcana",
      "lore": "Has no flag, but always a plan B. This card spawns on the deck a multi card every turn",
      "image": "art/Multimaker.webp",
      "abilities": [
        {
          "trigger": "onAnyTurnStart",
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
      "health": 4,
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
      "attack": 1,
      "health": 3,
      "keywords": [],
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
      "cost": 7,
      "type": "minion",
      "attack": 4,
      "health": 7,
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
      "attack": 2,
      "health": 5,
      "keywords": [],
      "race": "Monster",
      "rarity": "rare",
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
      "cost": 9,
      "type": "minion",
      "attack": 3,
      "health": 9,
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
      "cost": 6,
      "type": "minion",
      "attack": 3,
      "health": 10,
      "keywords": [
        "taunt"
      ],
      "race": "Human",
      "rarity": "common",
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
      "attack": 2,
      "health": 5,
      "keywords": [],
      "race": "Human",
      "rarity": "rare",
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
      "cost": 10,
      "type": "minion",
      "attack": 8,
      "health": 8,
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
      "cost": 9,
      "type": "minion",
      "attack": 7,
      "health": 5,
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
      "cost": 10,
      "type": "minion",
      "attack": 7,
      "health": 3,
      "keywords": [],
      "race": "Human",
      "rarity": "common",
      "country": "Indonesia",
      "lore": "This card can instantly attack when prepared..",
      "image": "art/RotiLapis.webp",
      "id": "base:rotilapis",
      "_expansionId": "base"
    },
    {
      "name": "SAVOIARDO",
      "cost": 5,
      "type": "minion",
      "attack": 3,
      "health": 7,
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
      "cost": 5,
      "type": "minion",
      "attack": 2,
      "health": 6,
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
      "cost": 1,
      "type": "minion",
      "attack": 2,
      "health": 3,
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
      "cost": 4,
      "type": "minion",
      "attack": 2,
      "health": 4,
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
      "name": "Turmwehr",
      "cost": 1,
      "type": "minion",
      "attack": 1,
      "health": 3,
      "keywords": [
        "taunt"
      ],
      "race": "Human",
      "rarity": "common",
      "country": "Austria",
      "lore": "One day we meet in Valhalla. This card has attack priority above all.",
      "image": "art/Turmwehr.webp",
      "id": "base:turmwehr",
      "_expansionId": "base"
    },
    {
      "name": "User",
      "cost": 1,
      "type": "minion",
      "attack": 1,
      "health": 3,
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
      "cost": 2,
      "type": "minion",
      "attack": 2,
      "health": 4,
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
      "cost": 3,
      "type": "minion",
      "attack": 2,
      "health": 4,
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
      "cost": 2,
      "type": "minion",
      "attack": 1,
      "health": 5,
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
      "name": "GoldenWarerita",
      "cost": 2,
      "type": "minion",
      "attack": 1,
      "health": 7,
      "keywords": [],
      "race": "Monster",
      "rarity": "mythic",
      "country": "Arcana",
      "lore": "Supporter's reward, a golden Warerita!.",
      "image": "art/GoldenWarerita.webp",
      "showInInventory": false,
      "id": "special:goldenwarerita",
      "_expansionId": "special"
    },
    {
      "name": "Multi",
      "cost": 1,
      "type": "minion",
      "attack": 3,
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
