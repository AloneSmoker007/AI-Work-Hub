"use strict";

/**
 * QuickQuote — WhatsApp-first quote calculator.
 *
 * Structure note (read before editing):
 *   - Pure logic lives in named `function` declarations at the top so it can be
 *     exercised directly by `qa/verify.mjs` without a bundler or test framework.
 *   - `initQuickQuote(doc)` is the only DOM-aware entry point. It is called with
 *     `document` at the bottom when running in a browser, and with a fake DOM in
 *     tests. Keep DOM lookups inside it.
 *   - `qa/verify.mjs` runs this exact file through `node:vm` with a fake DOM.
 *     There is no second copy of the math anywhere. If you change the logic here,
 *     the tests exercise the changed logic automatically.
 */

/* ------------------------------------------------------------------ *
 * Configuration
 * ------------------------------------------------------------------ */

const WHATSAPP_NUMBER = "15551234567";
const WHATSAPP_NUMBER_PATTERN = /^\d{8,15}$/;
const MIN_QTY = 1;
const MAX_QTY = 99;
const CURRENCY = "$";

/* ------------------------------------------------------------------ *
 * Pure logic — no DOM access below this line
 * ------------------------------------------------------------------ */

/**
 * Normalise a quantity input to an integer in [MIN_QTY, MAX_QTY].
 * Empty, non-numeric, NaN, Infinity and out-of-range values all fall back
 * to MIN_QTY so the quote can never become NaN or Infinity.
 */
function clampQuantity(rawQty) {
  const value = Number(rawQty);
  if (!Number.isFinite(value)) return MIN_QTY;
  return Math.min(MAX_QTY, Math.max(MIN_QTY, Math.floor(value)));
}

/**
 * Compute the quote.
 *
 * Numeric behaviour is identical to the original implementation for every
 * finite input (see `qa/verify.mjs`, which asserts this against the original
 * formula). The single deliberate difference: a non-finite base price or
 * multiplier yields `0` instead of propagating NaN/Infinity into the display,
 * because a customer-facing page must never render "$NaN".
 *
 * Negative prices are *not* silently masked here — a misconfigured price should
 * stay visible. `qa/verify.mjs` validates every configured price and multiplier
 * in `index.html` instead, so bad configuration fails CI loudly.
 */
function computeQuote(basePrice, rawQty, multiplier) {
  const qty = clampQuantity(rawQty);
  const base = Number(basePrice);
  const multiplierValue = Number(multiplier);
  const safeBase = Number.isFinite(base) ? base : 0;
  const safeMultiplier = Number.isFinite(multiplierValue) ? multiplierValue : 0;
  const total = Math.round(safeBase * qty * safeMultiplier);
  return { qty, total: Number.isFinite(total) ? total : 0 };
}

/**
 * Format a total for display.
 */
function formatEstimate(total) {
  return CURRENCY + Number(total).toLocaleString();
}

/**
 * Reduce a WhatsApp number to validated digits-only form.
 * Returns null when the value cannot be a real WhatsApp number, so a broken
 * CTA is never shipped silently.
 */
function normalizeWhatsAppNumber(raw) {
  const digits = String(raw === undefined || raw === null ? "" : raw).replace(/\D/g, "");
  return WHATSAPP_NUMBER_PATTERN.test(digits) ? digits : null;
}

/**
 * Build the wa.me deep link. Returns null for an invalid number so callers can
 * disable the CTA instead of shipping a dead link.
 */
function buildWhatsAppUrl(rawNumber, message) {
  const number = normalizeWhatsAppNumber(rawNumber);
  if (!number) return null;
  const text = typeof message === "string" ? message : "";
  return "https://wa.me/" + number + "?text=" + encodeURIComponent(text);
}

/**
 * Build the pre-filled WhatsApp message body.
 */
function buildWhatsAppMessage(serviceName, area, qty, total) {
  return [
    "Hi! I want a quote.",
    "Service: " + serviceName,
    "Quantity: " + qty,
    "Location: " + area,
    "Starting estimate: " + CURRENCY + total
  ].join("\n");
}

/**
 * Trim a `<option>` label down to its human-readable name.
 *   optionLabel("Basic Package — $80", " —")  -> "Basic Package"
 *   optionLabel("Nearby (+10%)",      " (")   -> "Nearby"
 * Kept exactly equivalent to the original `label.split(sep)[0]` behaviour,
 * including the requirement that the separator is not at index 0.
 */
function optionLabel(label, separator) {
  const text = typeof label === "string" ? label : "";
  const index = text.indexOf(separator);
  return (index > 0 ? text.slice(0, index) : text).trim();
}

/* ------------------------------------------------------------------ *
 * DOM layer — the only code that touches the page
 * ------------------------------------------------------------------ */

function initQuickQuote(doc) {
  const service = doc.querySelector("#service");
  const quantity = doc.querySelector("#qty");
  const location = doc.querySelector("#location");
  const estimate = doc.querySelector("#estimate");
  const whatsapp = doc.querySelector("#whatsapp");

  if (!service || !quantity || !location || !estimate || !whatsapp) return null;

  function updateQuote() {
    const { qty, total } = computeQuote(service.value, quantity.value, location.value);

    quantity.value = qty;
    estimate.textContent = formatEstimate(total);

    const selectedService = service.options[service.selectedIndex];
    const selectedLocation = location.options[location.selectedIndex];
    const serviceName = optionLabel(selectedService ? selectedService.text : "", " —");
    const area = optionLabel(selectedLocation ? selectedLocation.text : "", " (");

    const message = buildWhatsAppMessage(serviceName, area, qty, total);
    const url = buildWhatsAppUrl(WHATSAPP_NUMBER, message);

    if (url) {
      whatsapp.setAttribute("href", url);
    } else {
      // Never ship a dead CTA: disable the link instead of pointing at wa.me/null.
      whatsapp.setAttribute("href", "#");
      whatsapp.setAttribute("aria-disabled", "true");
    }
  }

  [service, quantity, location].forEach(function (field) {
    field.addEventListener("input", updateQuote);
    field.addEventListener("change", updateQuote);
  });

  updateQuote();
  return { updateQuote: updateQuote };
}

// Browser bootstrap. Guarded so the module can be loaded in a test sandbox
// (and so a stray import in Node never throws on `document`).
if (typeof document !== "undefined") {
  initQuickQuote(document);
}
