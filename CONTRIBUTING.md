# Contributing to Arcana TCG

Thank you for your interest in contributing to **Arcana TCG**! We welcome card designers, artists, balance testers, and backend/frontend developers.

---

## 🛠️ Local Development Setup

The repository is configured to run **100% out of the box** without requiring database credentials or external API keys for local testing.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- npm v9.0.0 or higher

### 2. Quickstart
```bash
# 1. Clone the repository
git clone https://github.com/your-username/arcane-duel-tcg.git
cd arcane-duel-tcg

# 2. Install dependencies
npm install

# 3. Build card catalog
npm run cards:build

# 4. Start the server
npm start
```
Open `http://localhost:8443` in your browser. You can test vs NPC locally or open two tabs to test room matchmaking.

---

## 🃏 Creating New Cards & Expansions

Cards are defined modularly inside the `expansions/` directory.

### Quick Card Authoring
1. Choose an existing expansion directory (e.g. `expansions/core/`) or create your own folder with an `expansion.json`.
2. Copy `expansions/_TEMPLATE_MINION.js` or `expansions/_TEMPLATE_SPELL.js`.
3. Fill in the card stats, keywords, rarity, race, country, lore, and optional abilities.
4. Validate your cards using the CLI:
   ```bash
   npm run cards:check
   ```
5. Rebuild the card catalog:
   ```bash
   npm run cards:build
   ```
   *(Or use `npm run cards:watch` to auto-rebuild while you edit).*

### 🎨 Card Artwork Generation Guide
To maintain a cohesive aesthetic across all sets, generate card artwork using the official prompt template:

**Prompt Template:**
```text
Square trading card illustration (1:1), designed for a collectible card game named "Arcana". The artwork fills almost the entire card. No text, no logos, no symbols, no numbers, a slight golden border, no UI elements. **Style: Painterly digital hand-painted, semi-realistic but ultra simplified, FLAT SHADES with NO GRADIENTS, discrete value steps with MODERATE contrast range, IRREGULAR ORGANIC PAINT PATCHES, visible hand-cut brush shapes with uneven edges, posterized lighting with close neighboring tones, bold clear silhouette with gentle but readable value separation, large graphic shapes, implied material using 4-8 flat tones only, matte non-blended shading. no gradients, no soft blending, no airbrush look, no outline, no text, no yellow AI tone, no noise, no thin parts, no vector-clean shapes, strong colors, good contrast Background complements the subject without distracting from it. Professional collectible card game artwork. subject: ''INSERT HERE SUBJECT''
```

**Image Specifications & Formatting:**
- **Aspect Ratio**: `1:1` (Square).
- **Resolution**: `512x512` to `1024x1024` px.
- **Format**: `.webp` (optimized compression; `.png` / `.jpg` also accepted).
- **Location**: Save in `public/art/<CardName>.webp`.
- **Card Code**: Reference as `image: "art/<CardName>.webp"`.


---

## 🧪 Testing & Verification

Before submitting a Pull Request, make sure all tests and validators pass cleanly:

```bash
# Check card catalog schemas
npm run cards:check

# Run smoke test simulation
npm run test:smoke

# Run ranked calculation tests
npm run test:ranked

# Run tournament bracket engine tests
npm run test:tournaments

# Run audio and PWA checks
npm run test:audio
npm run test:pwa
```

---

## 🔒 Security Guidelines

- **Never commit `.env` files, SSH keys, MongoDB connection strings, or Discord secrets.**
- All sensitive variables must be set via environment variables.
- If you discover a potential vulnerability, please report it privately to the maintainers rather than opening a public issue.

---

## 🚀 Pull Request Workflow

1. Fork the repository and create a new feature branch (`git checkout -b feature/my-new-card`).
2. Make your changes and write unit tests in `test/` if adding new engine features or ability effects.
3. Verify that `npm run cards:check` and `npm run test:smoke` pass.
4. Commit your changes with clear, descriptive commit messages.
5. Push to your fork and submit a Pull Request to `main`.
