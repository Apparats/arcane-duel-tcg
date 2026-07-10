const crypto = require("crypto");

const TICKET_TTL_MS = 10_000;
const TICKET_RE = /^[A-Za-z0-9_-]{32,128}$/;
const tickets = new Map();
const ticketByUserId = new Map();

function cleanupExpiredWsTickets(now = Date.now()) {
  tickets.forEach((ticket, value) => {
    if (ticket.expiresAt > now) return;
    tickets.delete(value);
    if (ticketByUserId.get(ticket.userId) === value) ticketByUserId.delete(ticket.userId);
  });
}

function issueWsTicket(user) {
  cleanupExpiredWsTickets();
  const userId = String(user.id);
  const previous = ticketByUserId.get(userId);
  if (previous) tickets.delete(previous);

  const value = crypto.randomBytes(32).toString("base64url");
  tickets.set(value, { user, userId, expiresAt: Date.now() + TICKET_TTL_MS });
  ticketByUserId.set(userId, value);
  return value;
}

function consumeWsTicket(value) {
  cleanupExpiredWsTickets();
  if (typeof value !== "string" || !TICKET_RE.test(value)) return null;
  const ticket = tickets.get(value);
  if (!ticket) return null;
  tickets.delete(value);
  if (ticketByUserId.get(ticket.userId) === value) ticketByUserId.delete(ticket.userId);
  return ticket.user;
}

module.exports = {
  TICKET_TTL_MS,
  cleanupExpiredWsTickets,
  consumeWsTicket,
  issueWsTicket,
};
