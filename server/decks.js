const express = require("express");
const { getSessionUser } = require("./auth");
const { activateDeck, autoBuildDeck, getDeckState, saveDeck } = require("./deckService");

const router = express.Router();

async function requireUser(req, res) {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Login with Discord is required." });
    return null;
  }
  return user;
}

router.get("/", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  res.json(await getDeckState(user.id));
});

router.post("/", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    res.json(await saveDeck(user.id, req.body || {}));
  } catch (err) {
    if (["INVALID_INPUT", "INVALID_ID"].includes(err.code)) return res.status(400).json({ error: err.message });
    if (err.code === "INVALID_DECK") return res.status(400).json({ error: err.message, errors: err.errors });
    console.error("Deck save failed:", err);
    res.status(500).json({ error: "Could not save deck." });
  }
});

router.post("/auto", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    res.json(await autoBuildDeck(user.id, req.body || {}));
  } catch (err) {
    if (["INVALID_INPUT", "INVALID_ID"].includes(err.code)) return res.status(400).json({ error: err.message });
    if (err.code === "AUTO_DECK_FAILED") return res.status(400).json({ error: err.message, errors: err.errors });
    console.error("Auto deck build failed:", err);
    res.status(500).json({ error: "Could not auto build deck." });
  }
});

router.post("/:id/activate", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    res.json(await activateDeck(user.id, req.params.id));
  } catch (err) {
    if (["INVALID_INPUT", "INVALID_ID"].includes(err.code)) return res.status(400).json({ error: err.message });
    if (err.code === "DECK_NOT_FOUND") return res.status(404).json({ error: err.message });
    console.error("Deck activation failed:", err);
    res.status(500).json({ error: "Could not activate deck." });
  }
});

module.exports = { router };
