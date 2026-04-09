/**
 * Shared UI / formatting helpers for Medivault.
 */

/** @type {readonly string[]} */
export const APPOINTMENT_STATUS_LABELS = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
];

/** @type {readonly string[]} */
export const ORDER_STATUS_LABELS = ["Placed", "Shipped", "Delivered", "Cancelled"];

/**
 * @param {string | undefined | null} addr
 * @param {number} [startChars]
 * @param {number} [endChars]
 */
export function shortAddr(addr, startChars = 6, endChars = 4) {
  if (!addr) return "—";
  const s = String(addr);
  if (s.length <= startChars + endChars) return s;
  return `${s.slice(0, startChars)}…${s.slice(-endChars)}`;
}

/**
 * @param {string | undefined | null} a
 * @param {string | undefined | null} b
 */
export function isSameAddress(a, b) {
  if (!a || !b) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}
