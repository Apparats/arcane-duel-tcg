# Arcane Duel

It has **two modes**, using the same rules engine:

1. **Vs NPC (local, 100% offline)** — runs entirely in the browser, no
   server, nothing to install. Great for testing card balance before
   the event.
2. **Online 1v1** — authoritative Node server (WebSocket) + room code

`public/cards.js` already comes compiled with the 20 base cards, so
both modes work out of the box without touching anything. You only
need to run the card compiler (see below) if you add or change cards
in `expansions/`.

## Offline mode: try it right now

No `npm install`, nothing needs to be running. Just:

1. Open `public/index.html` by double-clicking it (or dragging it into
   a browser).
2. Type your name and tap **"Practice vs NPC (local, no server)"**.
3. You play against a simple AI that plays cards and attacks on its own.

This works without an internet connection except for the Google Fonts
typefaces (if there's no internet, the game automatically falls back
to a system font — nothing breaks).

The AI is heuristic-based, not a search engine: it plays the most
expensive card it can afford, casts damage at the enemy's face, heals
its own hero only if it helps, and attacks face unless there's an
enemy Taunt (in which case it attacks the Taunt with the most health).
It's good for testing rules and cards, not for a competitive
challenge — that's what online 1v1 between people is for.

## Online mode:

⚠️ This only applies if you want people to play **against each other**
over the internet/network. If you're only going to use vs-NPC mode,
skip this section.

The server is **not a static site**: it needs a Node process running
at all times (for the WebSocket).

## Local use of online mode (server + two tabs)

```bash
npm install
npm start
```

Open `http://localhost:8443` in two tabs (or two devices on the same
network, using your machine's IP instead of `localhost`), and in the
lobby use "Create room" / "Join" instead of the NPC button.

Optional environment variable: `PORT` (default 8443).

## Production deployment (Oracle Cloud + Cloudflare + MongoDB + Discord)

This is the setup for running the game as a real, persistent site
instead of a one-off event server. None of this is required for the
game itself — online 1v1 and vs-NPC both work with zero configuration.
This only matters if you want player accounts (Discord login).

### 1. Oracle Cloud (hosting)

1. Create a Compute instance (the Always Free tier's Ampere A1 or
   E2.1.Micro shapes both work fine for this — it's a lightweight
   Node process).
2. Open the port you'll run on (80, or whatever you put in `PORT`) in
   **both** places Oracle requires: the instance's OS firewall
   (`sudo iptables ...` or `sudo ufw allow 80`, depending on the image)
   **and** the VCN's Security List / Network Security Group in the
   OCI console. Missing either one is the most common reason people
   get "connection refused" on a fresh instance.
3. Install Node (18+), clone/copy the project, then:
   ```bash
   cp .env.example .env   # fill in real values, see sections below
   npm install --omit=dev
   npm run cards:build
   ```
4. Run it as a real background service instead of a terminal session
   that dies when you disconnect — `deploy/arcane-duel.service` is a
   ready-to-use systemd unit; see the comment at the top of that file
   for the exact setup steps.

### 2. Cloudflare (domain + TLS)

1. Add your domain to Cloudflare and point its nameservers there.
2. Create an **A record** for your domain (or a subdomain, e.g.
   `play.yourdomain.com`) pointing at the Oracle instance's public IP,
   with the proxy (orange cloud) turned **on** — this gives you free
   HTTPS to visitors and hides the origin IP.
3. SSL/TLS mode: **Flexible** is the fastest way to get started (no
   certificate needed on the Oracle box at all — Cloudflare talks
   HTTPS to visitors and plain HTTP to your origin). The trade-off is
   that Cloudflare-to-origin traffic isn't encrypted, which matters
   more once real login sessions are flowing through it. When you're
   ready, upgrading to **Full (strict)** with a free
   [Cloudflare Origin Certificate](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/)
   installed on the Oracle box (e.g. via [Caddy](https://caddyserver.com/),
   which handles that almost automatically) closes that gap.
4. WebSockets work through Cloudflare's proxy by default on both
   Free and paid plans — nothing extra to configure for the game's
   WebSocket connection.

### 3. MongoDB (player accounts)

The easiest path is [MongoDB Atlas](https://www.mongodb.com/atlas)'s
free (M0) tier — no server to manage:

1. Create a free cluster, then a database user (username/password).
2. Under Network Access, allow the Oracle instance's public IP (or
   `0.0.0.0/0` while testing — tighten it to the specific IP once
   things work).
3. Copy the connection string it gives you into `MONGODB_URI` in `.env`.

The server auto-creates the `users` collection and its indexes on
first connection — no manual schema setup needed.

### 4. Discord (login)

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → New Application.
2. Under **OAuth2 → General**, copy the **Client ID** and **Client
   Secret** into `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` in `.env`.
3. Under **OAuth2 → Redirects**, add
   `https://yourdomain.com/auth/discord/callback` (must match
   `DISCORD_REDIRECT_URI` in `.env` exactly, including `https://`).
4. Generate a random `JWT_SECRET` for `.env`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

Once `MONGODB_URI`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`,
`DISCORD_REDIRECT_URI`, and `JWT_SECRET` are all set, restart the
server — its startup log tells you plainly whether accounts and login
are active:

```
Player accounts: enabled (MongoDB connected).
```

If any of those are missing, the server logs exactly that and simply
runs without accounts — it never crashes over missing auth config.

## How to play

Opening `public/index.html` lands on the **main menu**: two big tiles
for "Play Singleplayer" and "Play Multiplayer", plus three locked
tiles (Inventory, Shop, Config) reserved for later — clicking one just
shows a "coming soon" toast for now, they don't do anything yet.

1. One player enters their name and taps **Create room** → gets a
   4-letter code.
2. The other player enters their name, types that code, and taps
   **Join**.
3. The match starts on its own as soon as both are connected.

Base rules (editable, see below):

- 30 health per player.
- 1 extra mana crystal per turn (max 10).
- You start with 3 cards in hand (whoever goes 2nd gets 4, to
  compensate).
- Automatic draw phase at the start of each turn.
- Minions: can't attack the turn they're played, unless they have
  **Charge** (⚡). **Taunt** (🛡) forces it to be attacked before
  anything else. **Divine Shield** (✦) negates the first hit of damage
  they take.
- You win when the opponent's health reaches 0. If a deck runs out,
  further draws simply do nothing (no card, no damage) — there's no
  fatigue mechanic.
- Either player can **Surrender** at any time (it doesn't have to be
  your turn) via the small button next to End Turn — it asks for
  confirmation first, then immediately ends the match for the other
  player.

## Inventory screen

The "Inventory" tile on the main menu opens a browser for every card
in the game — filterable by **Type**, **Rarity**, **Country**, and
**Race** (the country/race dropdowns are built automatically from
whatever values your cards actually use, since both are free text).
Clicking a card opens it zoomed in with its full details: stats,
rarity, country, race, active keywords spelled out, a plain-English
description of its abilities (if it has any), and its lore.

There's no unlock system yet — every card shows up, all unlocked, on
purpose, for debugging while the game is still in development. The
inventory grid and zoom view already call a single function,
`isCardUnlocked(card)` in `public/inventory.js`, that currently just
always returns `true`. When real unlocks are built later, that's the
one place that needs to change — the locked-card visual state
(`.inventory-card-locked` in `public/css/inventory.css`) is already
wired up and waiting.

## Player accounts (Discord login)

Optional, and off by default. If `MONGODB_URI`, `DISCORD_CLIENT_ID`,
`DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, and `JWT_SECRET` are
all set (see the production deployment section above for how to get
each of those), a "Login with Discord" button appears in the top-right
corner of the main menu. If they're not set, that corner of the menu
stays empty and nothing else changes — matches are unaffected either
way, whether you're logged in or not.

How it works:

- `server/auth.js` — the Discord OAuth2 flow (`GET /auth/discord`
  redirects to Discord, `GET /auth/discord/callback` exchanges the
  code, fetches the Discord profile, and upserts a user record) plus
  session handling. Sessions are a signed JWT in an httpOnly cookie —
  there's no separate sessions table to expire or clean up.
- `server/db.js` — the MongoDB connection and the `users` collection
  helpers. `isDbEnabled()` / `isAuthEnabled()` in each file are what
  make the whole thing optional; both are checked before anything
  touches Mongo or Discord.
- `GET /auth/me` — returns `{ loggedIn, user, authEnabled }`; the
  client (`initAccountWidget()` in `public/client.js`) calls this once
  on page load to decide whether to show the login button or the
  logged-in profile chip.
- A logged-in user document currently stores `discordId`, `username`,
  `avatar`, `createdAt`/`lastLoginAt`, and two fields ready for
  later — `unlockedCards: []` and `stats: { wins, losses }` — neither
  is wired into gameplay yet (matches don't update them). That's the
  natural next step once you want accounts to actually matter beyond
  logging in.

## Board animations

Intentionally lightweight (only `transform`/`opacity`/`box-shadow`,
nothing that forces layout recalculations) and exist to make the match
readable at a glance:

- **Attack**: the attacking minion lunges toward the target and back.
- **Damage**: shake + red flash + floating red number, on both minions
  and heroes.
- **Heal**: green flash + floating green number.
- **Death**: the minion shrinks and fades out before disappearing.
- **Summon**: a new minion appears with a small "pop".

How it works under the hood (`public/client.js`): every time a new
state arrives from the engine (online via WebSocket, or local with no
network), the client compares it against the previous state *before*
redrawing the board — if something's health went up or down, or a
minion disappeared, it fires the matching animation on the elements
still on screen, waits ~340ms (`SETTLE_DELAY` in `client.js`) so it's
visible, and only then rebuilds the DOM with the final state. The
engine (`engine.js`) only contributes one small extra piece of data for
this — `lastAction`, who attacked what — everything else (damage,
healing, deaths) is detected by comparing health numbers, so any
source of damage/healing gets animated for free without touching the
engine. If you'd rather have no on-screen motion, your OS's
`prefers-reduced-motion` setting disables all of this automatically.

## Project structure

```
.env.example → template for every environment variable the server reads
deploy/
  arcane-duel.service → example systemd unit for running on Oracle Cloud
expansions/
  _TEMPLATE_MINION.js → commented template to copy (not compiled)
  _TEMPLATE_SPELL.js  → commented template to copy (not compiled)
  core/
    expansion.json    → this expansion's metadata (id, name, enabled)
    *.js              → one card per file
  demo-habilidades/
    expansion.json    → you can disable this whole folder with "enabled": false
    *.js              → 4 example cards for the abilities system (see that section)
scripts/
  build-cards.js → compiles expansions/ → public/cards.js (see the cards section)
server/
  index.js   → Express + WebSocket server, room matchmaking
              (uses the shared engine from public/engine.js)
  db.js      → MongoDB connection + user account helpers (optional, see below)
  auth.js    → Discord OAuth2 login + session cookie (optional, see below)
public/
  index.html
  cards.js   → ⚠️ GENERATED by scripts/build-cards.js, don't edit by hand
  engine.js  → authoritative rules engine (shared: Node and browser)
  ai.js      → simple AI for vs-NPC mode (browser only)
  client.js  → vanilla client; handles both online mode (WebSocket)
              and local mode (calls the engine directly, no network)
  inventory.js → inventory screen: card grid, filters, zoom view
              (reuses card-rendering helpers from client.js)
  css/
    base.css      → design tokens (:root), reset, shared buttons
    menu.css      → main menu screen (big tiles, locked tiles, account widget)
    lobby.css     → lobby screen (create/join/NPC)
    board.css     → board structure: frame, grid, heroes, turn seal
    cards.css     → minions on the board and cards in hand
    inventory.css → inventory grid, filters, card zoom panel
    fx.css        → animations: attack, damage, heal, death, summon
    overlay.css   → target hint, end of match, error toast, card tooltip
test/
  simulate.js → optional smoke test for online mode: simulates a full
              match over WebSocket (requires the server to be running)
```

`engine.js` imports `./cards` (the generated one) so the rules logic
isn't duplicated between online and local mode — it's the same source
of truth in both cases. The server in turn imports the engine from
`../public/engine`.

CSS is split by responsibility in `public/css/` instead of one big
file. `index.html` links them in order (`base` first, since that's
where the color/typography variables the others use live). If you're
about to touch something:
- Is it a color, font, or button used on more than one screen? → `base.css`
- Is it the main menu (tiles, locked screens)? → `menu.css`
- Is it lobby-related (inputs, create/join room)? → `lobby.css`
- Is it the board's structure (frame, heroes, turn seal)? → `board.css`
- Is it about how cards look (minion or hand)? → `cards.css`
- Is it a floating element (toast, hint, end screen)? → `overlay.css`

Each file is independent — you can add a new `public/css/whatever.css`
and a `<link>` in `index.html` without touching the others.

## Adding cards for your event (expansion system)

Cards are no longer edited in one giant array. Each card is its own
file, grouped into "expansion" folders inside `expansions/` — it's the
same idea as a Spigot plugin: each expansion has its own
`expansion.json` (the equivalent of `plugin.yml`: defines the `id` and
name), and inside it, one file per card.

```
expansions/
  core/
    expansion.json          → { "id": "core", "name": "Set Base", "enabled": true }
    recluta-novato.js
    explorador-agil.js
    ...
  my-expansion/               → create a new folder for your event
    expansion.json
    my-new-card.js
```

A card looks like this (a minion):

```js
// expansions/my-expansion/obsidian-golem.js
module.exports = {
  name: "Obsidian Golem",
  cost: 4,
  type: "minion",
  attack: 3,
  health: 6,
  keywords: ["taunt"],   // "taunt" | "charge" | "divineShield" | []

  // "race" is free text — there's no fixed list, put whatever you want
  // ("Human", "Dragon", "Construct", "Elemental", whatever fits).
  race: "Construct",

  // Presentation fields (shown when hovering over the card):
  rarity: "rare",         // "common" | "rare" | "legendary"
  country: "Arcana",      // the country/faction — pick whichever you want
  lore: "Carved by hands no one remembers anymore.",

  // optional: path relative to public/ or a URL. If you leave it out,
  // the card shows a generic icon based on its type (⚔ minion, ✦ spell).
  image: "art/obsidian-golem.png",
};
```

Or a spell:

```js
// expansions/my-expansion/frost-bolt.js
module.exports = {
  name: "Frost Bolt",
  cost: 3,
  type: "spell",
  effect: "damage",   // "damage" | "heal" | "draw"
  value: 4,

  rarity: "common",
  country: "Arcana",
  lore: "The cold that comes before the storm.",
};
```

`rarity`, `country`, and `lore` are **required** on every card (the
build fails if any is missing, pointing at the exact file). `race` is
**required only on minions** (spells don't need it) and, just like
`country`, is free text — there's no fixed list of races, make up
whatever you want. `image` is optional.

Rarity sets the card's border color: gray for common, blue for rare,
gold with a glow for legendary. Keywords (Taunt/Charge/Divine Shield)
show up as a small colored circle in the corner of the card — Divine
Shield's in particular is a filled sky-blue circle, and it disappears
from the board on its own once the minion has already absorbed a hit
with it (it still shows in hand, where nothing's been consumed yet).
Hovering over any card (in hand or on the board) shows a tooltip with
name, rarity, race, country, the active keywords with their full name,
and the lore.

**Note:** for now every card uses "Arcana" as its country — it's a
placeholder. The field exists so you can pick whichever country you
want later on when creating new cards; it doesn't have to stay the
same for all of them.

Special abilities (unique per-card effects beyond `keywords`) are
already implemented — see the "Special abilities (abilities)" section
below.

You don't need to set `id` by hand — it's generated automatically as
`"<expansion-id>:<filename>"` (e.g. this file would give
`"my-expansion:obsidian-golem"`). You only write it yourself if for
some reason you need a specific one.

There are two commented templates ready to copy:
`expansions/_TEMPLATE_MINION.js` and `expansions/_TEMPLATE_SPELL.js`
(those two loose files do NOT get compiled — they live outside any
expansion folder on purpose, they're only there to copy and paste).

### Compiling

After adding/editing cards, run:

```bash
npm run cards:build
```

This reads all of `expansions/`, validates every card (name, cost,
attack/health/race or effect/value, valid keywords, rarity/country/lore,
unique ids) and generates `public/cards.js` — the file the engine
uses. **Don't edit `public/cards.js` by hand**, it has a warning at
the top reminding you: it gets overwritten every time you run the
build.

If something's wrong (a missing field, a keyword that doesn't exist,
two cards with the same id), the build stops and tells you exactly
which file and which field is broken, instead of failing silently
mid-match.

Other useful commands:

```bash
npm run cards:check   # validates everything without writing public/cards.js (to check before building)
npm run cards:watch   # rebuilds only whenever you save a change in expansions/
```

### Disabling an entire expansion

Set `"enabled": false` in its `expansion.json` and rebuild — it gets
skipped entirely, without deleting the files. Useful for testing a new
card set for the event without mixing it into the base deck yet.

## Special abilities (abilities)

Beyond `keywords` (Taunt/Charge/Divine Shield), a card can carry an
optional `abilities` field: a list of special effects beyond basic
stats — "draw more cards", "area damage", "summon something when this
minion dies", etc.

**Why it's a list of data instead of code:** cards go through
`JSON.stringify` in `scripts/build-cards.js` to build `public/cards.js`
(that way the engine works the same on the server and in the browser,
with no build step at runtime). JSON can't carry functions. So a card
doesn't write the effect's logic itself — it just **names** an effect
the engine already knows, along with its parameters:

```js
abilities: [
  { trigger: "onPlay", effect: "drawCards", value: 1 },
]
```

`trigger` is when it fires:
- `"onPlay"` → when the card is played (the minion is already on the
  board, or right after a spell resolves).
- `"onDeath"` → when a minion with this card dies.
- `"onTurnStart"` → at the start of the controlling player's turn, for
  every minion with this card currently on their board — fires every
  turn it's alive, not just once. This is how you make a card summon
  (or do anything else) every turn, e.g. "summon a specific card each
  turn while this is alive".

`effect` has to be one of the ones that already exist in
`ABILITY_EFFECTS` inside `public/engine.js`:

| effect | parameters | what it does |
|---|---|---|
| `drawCards` | `value` | whoever played the card draws `value` cards |
| `damageAllEnemyMinions` | `value` | `value` damage to ALL enemy minions |
| `damageAllMinions` | `value` | `value` damage to ALL minions, on both sides |
| `damageEnemyHero` | `value` | `value` damage directly to the enemy hero, no target needed |
| `healAllFriendlyMinions` | `value` | heals all your minions for `value` |
| `summonMinion` | `cardId`, `count` (optional, default 1) | summons copies of another card (by id) onto your board |
| `buffAllFriendlyMinions` | `attack` and/or `health` | adds stats to all your minions |

A spell can be "classic" (with a single-target `effect`/`value`, as
usual) **or** work entirely through `abilities` — in that case just
don't set a top-level `effect`/`value`, and the client won't ask for a
target when you play it (for example, an area-damage spell doesn't
have a single target to choose). It can also have both at once if you
want a spell that hits a target AND does something extra.

`summonMinion` validates that the `cardId` you give it really exists
among all enabled expansions — if you typo the id, the build stops
with the exact file pointed out instead of failing silently mid-match.

There are 4 example cards in `expansions/demo-habilidades/` showing
each pattern (feel free to delete that whole folder or set
`"enabled": false` in its `expansion.json` if you don't want them in
the event's deck):

- **Bibliotecario Errante** (minion, `onPlay` → `drawCards`)
- **Onda de Escarcha** (targetless spell, `onPlay` → `damageAllEnemyMinions`)
- **Portador de Ecos** (minion, `onDeath` → `summonMinion` a Recluta Novato)
- **Altar Invocador** (minion, `onTurnStart` → `summonMinion` a Recluta Novato, every turn it survives)

### Adding a new effect

If `abilities` isn't enough (you need something none of the effects in
the table cover), you add a new one in two places:

1. `public/engine.js` → one more function inside `ABILITY_EFFECTS`
   (receives `(game, ctx, ability)`; `ctx.casterIdx` is who played the
   card, `ctx.sourceName` is its name for the log).
2. `scripts/build-cards.js` → add the name to `VALID_ABILITY_EFFECTS`
   and, if it has its own required parameters, a case in
   `validateAbilities` (look at how `summonMinion` is done as an example).

Without that, the compiler will reject any card that uses an effect
that isn't on the list — on purpose, so a typo in the effect's name
gets caught at build time instead of mid-match.
