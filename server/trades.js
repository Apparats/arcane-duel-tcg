const express = require("express");
const { getSessionUser } = require("./auth");
const {
  cancelTrade,
  collectionUpdateFor,
  confirmTrade,
  getOrCreateTradeCode,
  getSessionForUser,
  listSessionsForUser,
  publicTradeSession,
  refreshTradeCode,
  setTradeOffer,
  startTradeByCode,
} = require("./tradeService");

const router = express.Router();

async function requireUser(req, res) {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Login with Discord is required." });
    return null;
  }
  return user;
}

function sendTradeError(res, err) {
  if (["INVALID_INPUT", "INVALID_ID"].includes(err.code)) {
    return res.status(400).json({ error: err.message });
  }
  if (["TRADE_CODE_NOT_FOUND", "SELF_TRADE", "TRADE_NOT_FOUND", "UNKNOWN_CARD", "MISSING_OFFERS"].includes(err.code)) {
    return res.status(400).json({ error: err.message });
  }
  if (["CARD_NOT_OWNED", "CARD_LOCKED_BY_DECK"].includes(err.code)) {
    return res.status(400).json({ error: err.message });
  }
  console.error("Trade failed:", err);
  return res.status(500).json({ error: "Could not process trade." });
}

router.get("/me", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const code = getOrCreateTradeCode(user);
  const sessions = listSessionsForUser(user).map((session) => publicTradeSession(session, user.id));
  res.json({ code, sessions });
});

router.post("/refresh-code", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  res.json({ code: refreshTradeCode(user) });
});

router.post("/start", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const session = startTradeByCode(user, req.body?.code);
    res.json({ trade: publicTradeSession(session, user.id) });
  } catch (err) {
    sendTradeError(res, err);
  }
});

router.get("/:id", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const session = getSessionForUser(req.params.id, user);
    res.json({
      trade: publicTradeSession(session, user.id),
      collectionUpdate: collectionUpdateFor(session, user.id),
    });
  } catch (err) {
    sendTradeError(res, err);
  }
});

router.post("/:id/offer", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const session = setTradeOffer(req.params.id, user, req.body?.cardId);
    res.json({ trade: publicTradeSession(session, user.id) });
  } catch (err) {
    sendTradeError(res, err);
  }
});

router.post("/:id/confirm", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const session = await confirmTrade(req.params.id, user);
    res.json({
      trade: publicTradeSession(session, user.id),
      collectionUpdate: collectionUpdateFor(session, user.id),
    });
  } catch (err) {
    sendTradeError(res, err);
  }
});

router.post("/:id/cancel", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const session = cancelTrade(req.params.id, user);
    res.json({ trade: publicTradeSession(session, user.id) });
  } catch (err) {
    sendTradeError(res, err);
  }
});

module.exports = { router };
