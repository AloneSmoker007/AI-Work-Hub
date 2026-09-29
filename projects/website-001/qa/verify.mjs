/**
 * Website 001 — QA suite.
 *
 * Why this file exists (read this before changing anything):
 *   The previous version of this suite read `app.js` as a *string* and asserted
 *   that certain substrings were present, then tested a hand-written copy of the
 *   maths that lived inside this file. That meant the suite passed even when
 *   `app.js` was broken. (Proven: removing `Math.max(1, ...)` from the clamp
 *   still printed "QA checks passed.")
 *
 *   This version runs the real `app.js` through `node:vm` against a fake DOM and
 *   drives it the way a browser does: sets `<select>`/`<input>` values, dispatches
 *   `input`/`change` events, and reads back `textContent` and `href`. There is no
 *   second copy of the maths anywhere.
 *
 *   The last section of this file is a self-test: it deliberately re-runs the
 *   suite against a *mutated* copy of `app.js` and asserts that the suite fails.
 *   If you weaken these tests, that self-test goes red.
 *
 * Zero dependencies. Requires Node 18+.
 */

import { readFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const appUrl = new URL("../site/app.js", import.meta.url);
const htmlUrl = new URL("../site/index.html", import.meta.url);
const SITE_DIR = dirname(htmlUrl.pathname);

const APP_SOURCE = await readFile(appUrl, "utf8");
const HTML_SOURCE = await readFile(htmlUrl, "utf8");

/* ================================================================== *
 * Minimal fake DOM — enough to run `app.js` unmodified
 * ================================================================== */

class FakeElement {
  constructor(id) {
    this.id = id;
    this.value = "";
    this.textContent = "";
    this.options = [];
    this.selectedIndex = 0;
    this.attributes = new Map();
    this.listeners = new Map();
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }

  dispatch(type) {
    for (const handler of this.listeners.get(type) ?? []) handler({ type, target: this });
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }
}

class FakeDocument {
  constructor() {
    this.elements = new Map();
  }

  add(id) {
    const el = new FakeElement(id);
    this.elements.set("#" + id, el);
    return el;
  }

  querySelector(selector) {
    return this.elements.get(selector) ?? null;
  }
}

function buildFixture() {
  const doc = new FakeDocument();

  const service = doc.add("service");
  service.options = [
    { text: "Basic Package — $80" },
    { text: "Premium Package — $140" },
    { text: "Full Package — $220" }
  ];
  service.selectedIndex = 0;
  service.value = "80";

  const qty = doc.add("qty");
  qty.value = "1";

  const location = doc.add("location");
  location.options = [
    { text: "Local" },
    { text: "Nearby (+10%)" },
    { text: "Outside area (+20%)" }
  ];
  location.selectedIndex = 0;
  location.value = "1";

  doc.add("estimate");
  doc.add("whatsapp");

  return doc;
}

/**
 * Execute the real `app.js` in a clean V8 context with the fake DOM.
 * The trailing `__capture(...)` call is appended in the *same script scope*, so
 * the test gets real references to the internal functions without `app.js` having
 * to publish anything on `window`.
 */
function loadApp(source) {
  const doc = buildFixture();
  let captured = null;

  const sandbox = {
    document: doc,
    console: { log() {}, warn() {}, error() {} },
    __capture(api) {
      captured = api;
    }
  };

  const context = vm.createContext(sandbox);
  const instrumented =
    source +
    "\n;__capture({ clampQuantity, computeQuote, formatEstimate, " +
    "normalizeWhatsAppNumber, buildWhatsAppUrl, buildWhatsAppMessage, " +
    "optionLabel, initQuickQuote });\n";

  vm.runInContext(instrumented, context, { filename: "app.js" });

  return { doc, api: captured, context };
}

/* ================================================================== *
 * Tiny assertion harness
 * ================================================================== */

function makeRunner() {
  const failures = [];
  const passed = [];

  const check = (name, condition, detail) => {
    if (condition) passed.push(name);
    else failures.push(detail ? `${name} — ${detail}` : name);
  };

  const equal = (name, actual, expected) => {
    const ok = Object.is(actual, expected);
    check(name, ok, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  };

  return { check, equal, failures, passed };
}

/* ================================================================== *
 * The suite
 * ================================================================== */

const CANONICAL_VECTORS = [
  [80, 1, 1, 80],
  [140, 99, 1.2, 16632],
  [220, 99, 1.2, 26136],
  [220, 100, 1, 21780],
  [80, 0, 1, 80],
  [80, -5, 1.1, 88],
  [80, "", 1, 80],
  [80, "abc", 1, 80],
  [80, 1.9, 1, 80],
  [80, NaN, 1, 80],
  [80, Infinity, 1, 80],
  [220, 99, 1.1, 23958]
];

const FORBIDDEN_JS = [
  ["innerHTML", /innerHTML/],
  ["outerHTML", /outerHTML/],
  ["insertAdjacentHTML", /insertAdjacentHTML/],
  ["document.write", /document\.write/],
  ["eval(", /\beval\s*\(/],
  ["new Function(", /new\s+Function\s*\(/],
  ["string setTimeout", /setTimeout\s*\(\s*["'`]/],
  ["string setInterval", /setInterval\s*\(\s*["'`]/],
  // XML namespace URIs (SVG/XHTML) are identifiers, not fetched origins, so
  // www.w3.org is allowed. Any other http:// origin is a finding.
  ["http:// (non-https origin)", /http:\/\/(?!www\.w3\.org\/)/],
  ["javascript: URL", /javascript\s*:/]
];

/** Strip XML namespace URIs before looking for third-party origins. */
const stripNamespaces = (s) => s.replace(/http:\/\/www\.w3\.org\//g, "");

const REQUIRED_IDS = ["service", "qty", "location", "estimate", "whatsapp"];

async function runSuite(appSource, htmlSource) {
  const t = makeRunner();

  /* ---------- 0. harness sanity: the real code actually loaded ---------- */
  let loaded;
  try {
    loaded = loadApp(appSource);
  } catch (error) {
    t.check("app.js executes without throwing", false, error.message);
    return t;
  }
  t.check("app.js executes without throwing", true);

  const { doc, api } = loaded;
  t.check("pure API is reachable from the test harness", Boolean(api && api.computeQuote),
    "app.js did not expose its top-level functions to the sandbox");

  if (!api || !api.computeQuote) return t;

  /* ---------- 1. pure logic ---------- */
  t.equal("clampQuantity: 1 stays 1", api.clampQuantity(1), 1);
  t.equal("clampQuantity: 99 stays 99", api.clampQuantity(99), 99);
  t.equal("clampQuantity: 100 clamps to 99", api.clampQuantity(100), 99);
  t.equal("clampQuantity: 0 clamps to 1", api.clampQuantity(0), 1);
  t.equal("clampQuantity: -5 clamps to 1", api.clampQuantity(-5), 1);
  t.equal("clampQuantity: 1.9 floors to 1", api.clampQuantity(1.9), 1);
  t.equal('clampQuantity: "" clamps to 1', api.clampQuantity(""), 1);
  t.equal('clampQuantity: "abc" clamps to 1', api.clampQuantity("abc"), 1);
  t.equal("clampQuantity: NaN clamps to 1", api.clampQuantity(NaN), 1);
  t.equal("clampQuantity: Infinity clamps to 1", api.clampQuantity(Infinity), 1);
  t.equal('clampQuantity: "99" clamps to 99', api.clampQuantity("99"), 99);
  t.equal("clampQuantity: 100.9 floors then clamps to 99", api.clampQuantity(100.9), 99);

  t.equal("computeQuote: qty is normalised", api.computeQuote(80, 100, 1).qty, 99);
  t.equal("computeQuote: total is finite for NaN base", api.computeQuote(NaN, 5, 1).total, 0);
  t.equal("computeQuote: total is finite for Infinity multiplier",
    api.computeQuote(80, 5, Infinity).total, 0);
  t.check("computeQuote: never returns NaN/Infinity",
    Number.isFinite(api.computeQuote(NaN, NaN, NaN).total));

  // Regression guard for the refactor: negative configured prices must NOT be
  // silently clamped to 0. A misconfigured price should stay visible so the
  // configuration checks below (and a human) catch it.
  t.equal("computeQuote: negative base is not silently clamped",
    api.computeQuote(-80, 3, 1).total, -240);
  t.equal("computeQuote: negative multiplier is not silently clamped",
    api.computeQuote(80, 3, -1).total, -240);
  t.equal("computeQuote: fractional multiplier matches the original rounding",
    api.computeQuote(80, 3, 1.1).total, 264);
  t.equal("computeQuote: 140 x 99 x 1.2 matches the original rounding",
    api.computeQuote(140, 99, 1.2).total, 16632);
  t.equal("computeQuote: a zero price legitimately renders 0",
    api.computeQuote(0, 5, 1).total, 0);

  t.equal("formatEstimate: 80", api.formatEstimate(80), "$" + (80).toLocaleString());
  t.equal("formatEstimate: 16632", api.formatEstimate(16632), "$" + (16632).toLocaleString());
  t.check("formatEstimate: always prefixed with the currency symbol",
    api.formatEstimate(0).startsWith("$"));

  t.equal("normalizeWhatsAppNumber: digits pass", api.normalizeWhatsAppNumber("15551234567"), "15551234567");
  t.equal("normalizeWhatsAppNumber: +1 555 123 4567 is normalised",
    api.normalizeWhatsAppNumber("+1 555 123 4567"), "15551234567");
  t.equal("normalizeWhatsAppNumber: 7 digits is rejected", api.normalizeWhatsAppNumber("1234567"), null);
  t.equal("normalizeWhatsAppNumber: 16 digits is rejected", api.normalizeWhatsAppNumber("1234567890123456"), null);
  t.equal("normalizeWhatsAppNumber: letters are rejected", api.normalizeWhatsAppNumber("not-a-number"), null);
  t.equal("normalizeWhatsAppNumber: empty is rejected", api.normalizeWhatsAppNumber(""), null);
  t.equal("normalizeWhatsAppNumber: null is rejected", api.normalizeWhatsAppNumber(null), null);

  t.equal("buildWhatsAppUrl: valid number",
    api.buildWhatsAppUrl("15551234567", "hello"),
    "https://wa.me/15551234567?text=hello");
  t.equal("buildWhatsAppUrl: encodes the message",
    api.buildWhatsAppUrl("15551234567", "a&b=c\nd"),
    "https://wa.me/15551234567?text=" + encodeURIComponent("a&b=c\nd"));
  t.equal("buildWhatsAppUrl: invalid number returns null (never a dead CTA)",
    api.buildWhatsAppUrl("1234567", "hello"), null);
  t.equal("buildWhatsAppUrl: injection attempt is encoded, not executed",
    api.buildWhatsAppUrl("15551234567", '"><script>alert(1)</script>'),
    "https://wa.me/15551234567?text=" + encodeURIComponent('"><script>alert(1)</script>'));
  t.check("buildWhatsAppUrl: output is always https",
    api.buildWhatsAppUrl("15551234567", "x").startsWith("https://"));

  t.equal("optionLabel: service label",
    api.optionLabel("Basic Package — $80", " —"), "Basic Package");
  t.equal("optionLabel: location label",
    api.optionLabel("Nearby (+10%)", " ("), "Nearby");
  t.equal("optionLabel: separator at index 0 is ignored",
    api.optionLabel("— leading", " —"), "— leading");
  t.equal("optionLabel: non-string is safe", api.optionLabel(undefined, " —"), "");

  t.equal("buildWhatsAppMessage: shape",
    api.buildWhatsAppMessage("Basic Package", "Local", 2, 160),
    "Hi! I want a quote.\nService: Basic Package\nQuantity: 2\nLocation: Local\nStarting estimate: $160");

  /* ---------- 2. canonical arithmetic vectors against the REAL code ---------- */
  for (const [base, raw, multiplier, expected] of CANONICAL_VECTORS) {
    const { qty, total } = api.computeQuote(base, raw, multiplier);
    const expectedQty = Number.isFinite(Number(raw))
      ? Math.min(99, Math.max(1, Math.floor(Number(raw))))
      : 1;
    t.equal(`vector [${base}, ${String(raw)}, ${multiplier}] total`, total, expected);
    t.equal(`vector [${base}, ${String(raw)}, ${multiplier}] qty`, qty, expectedQty);
    t.check(`vector [${base}, ${String(raw)}, ${multiplier}] displays safely`,
      !Number.isNaN(total) && Number.isFinite(total));
  }

  /* ---------- 3. DOM integration (drives the real listeners) ---------- */
  const service = doc.querySelector("#service");
  const qty = doc.querySelector("#qty");
  const location = doc.querySelector("#location");
  const estimate = doc.querySelector("#estimate");
  const whatsapp = doc.querySelector("#whatsapp");

  t.equal("initial render: estimate is $80", estimate.textContent, "$" + (80).toLocaleString());
  t.equal("initial render: qty normalised to 1", qty.value, 1);
  t.equal("initial render: href is a wa.me link",
    whatsapp.getAttribute("href").startsWith("https://wa.me/15551234567?text="), true);

  service.value = "220";
  service.selectedIndex = 2;
  service.dispatch("change");
  t.equal("change service: estimate updates", estimate.textContent, "$" + (220).toLocaleString());
  t.check("change service: message names the service",
    decodeURIComponent(whatsapp.getAttribute("href").split("?text=")[1]).includes("Service: Full Package"));

  location.value = "1.2";
  location.selectedIndex = 2;
  location.dispatch("change");
  t.equal("change location: multiplier applied",
    estimate.textContent, "$" + Math.round(220 * 1 * 1.2).toLocaleString());
  t.check("change location: message names the area",
    decodeURIComponent(whatsapp.getAttribute("href").split("?text=")[1]).includes("Location: Outside area"));

  qty.value = "100";
  qty.dispatch("input");
  t.equal("input 100: qty written back as 99", qty.value, 99);
  t.equal("input 100: estimate uses 99", estimate.textContent,
    "$" + Math.round(220 * 99 * 1.2).toLocaleString());

  qty.value = "0";
  qty.dispatch("input");
  t.equal("input 0: qty written back as 1", qty.value, 1);

  qty.value = "-5";
  qty.dispatch("input");
  t.equal("input -5: qty written back as 1", qty.value, 1);

  qty.value = "abc";
  qty.dispatch("input");
  t.equal('input "abc": qty written back as 1', qty.value, 1);
  t.check('input "abc": estimate is never NaN',
    !estimate.textContent.includes("NaN") && !estimate.textContent.includes("Infinity"));

  qty.value = "1.9";
  qty.dispatch("input");
  t.equal("input 1.9: qty written back as 1", qty.value, 1);

  qty.value = "2";
  qty.dispatch("change");
  t.check("change event also re-renders",
    estimate.textContent === "$" + Math.round(220 * 2 * 1.2).toLocaleString());

  const finalMessage = decodeURIComponent(whatsapp.getAttribute("href").split("?text=")[1]);
  t.check("message carries service", finalMessage.includes("Service: Full Package"));
  t.check("message carries quantity", finalMessage.includes("Quantity: 2"));
  t.check("message carries location", finalMessage.includes("Location: Outside area"));
  t.check("message carries estimate", finalMessage.includes("Starting estimate: $"));
  t.check("href uses encodeURIComponent (no raw newlines leak into the URL)",
    !whatsapp.getAttribute("href").includes("\n"));

  /* ---------- 4. security assertions on the shipped source ---------- */
  for (const [label, pattern] of FORBIDDEN_JS) {
    t.check(`app.js: no ${label}`, !pattern.test(appSource), `matched ${pattern}`);
  }
  t.check("app.js: the WhatsApp host is https://wa.me/", /https:\/\/wa\.me\//.test(appSource));
  t.check("app.js: message text is encoded", /encodeURIComponent\(/.test(appSource));
  t.check("app.js: quantity is validated before use",
    /Number\.isFinite\(/.test(appSource) && /Math\.floor\(/.test(appSource));
  t.check("app.js: strict mode", /["']use strict["']/.test(appSource));

  for (const [label, pattern] of FORBIDDEN_JS) {
    t.check(`index.html: no ${label}`, !pattern.test(htmlSource), `matched ${pattern}`);
  }
  t.check("index.html: no inline event handlers", !/\son(click|load|error|mouseover|focus|blur)\s*=/i.test(htmlSource));
  t.check("index.html: no inline <script> bodies", !/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(htmlSource));
  t.check("index.html: stylesheet is local and relative", /href="\.\/styles\.css"/.test(htmlSource));
  t.check("index.html: app.js is loaded relatively", /src="\.\/app\.js"/.test(htmlSource));
  t.check("index.html: no third-party origins",
    !/https?:\/\/(?!wa\.me)/.test(stripNamespaces(htmlSource).replace(/https?:\/\/wa\.me/g, "")));

  /* ---------- 5b. link integrity ("no broken links") ---------- */
  const anchorTargets = [...htmlSource.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  for (const target of new Set(anchorTargets)) {
    t.check(`index.html: anchor #${target} has a matching id`,
      new RegExp(`id="${target}"`).test(htmlSource));
  }
  t.check("index.html: at least one in-page anchor is used", anchorTargets.length > 0);

  const localAssets = [...htmlSource.matchAll(/(?:href|src)="(\.\/[^"#?]+)"/g)].map((m) => m[1]);
  for (const asset of new Set(localAssets)) {
    const absolute = resolve(SITE_DIR, asset);
    let exists = true;
    try {
      await access(absolute);
    } catch {
      exists = false;
    }
    t.check(`index.html: local asset ${asset} exists on disk`, exists);
  }
  t.check("index.html: a favicon is declared", /rel="icon"/.test(htmlSource));

  /* ---------- 5c. configuration validation (CUSTOMIZE.md hazards) ---------
   * These fail CI loudly instead of letting a misconfigured price render as
   * "$0", "$NaN" or a silently wrong figure on a customer's live site.
   */
  const serviceOptions = [...htmlSource.matchAll(
    /<option value="([^"]*)">([^<]*?)(?:\s*—\s*\$([0-9.,]+))?<\/option>/g
  )];
  const pricedOptions = serviceOptions.filter((m) => m[3] !== undefined);

  t.check("config: at least one service option carries a visible price",
    pricedOptions.length > 0, "no `<option value=\"…\">Label — $price</option>` found");

  for (const [, value, label, shownPrice] of pricedOptions) {
    const numericValue = Number(value);
    const shown = Number(shownPrice.replace(/,/g, ""));
    t.check(`config: service "${label.trim()}" has a finite, positive price`,
      Number.isFinite(numericValue) && numericValue > 0,
      `value=${JSON.stringify(value)} must be a finite number > 0`);
    t.equal(`config: service "${label.trim()}" label price matches its value`, shown, numericValue);
  }

  const multiplierOptions = [...htmlSource.matchAll(/<option value="([^"]*)">[^<]*\(\+?[0-9]+%\)<\/option>/g)];
  t.check("config: at least one location multiplier is present", multiplierOptions.length > 0);
  for (const [, value] of multiplierOptions) {
    const numericValue = Number(value);
    t.check(`config: location multiplier ${value} is finite and > 0`,
      Number.isFinite(numericValue) && numericValue > 0);
  }

  const appNumber = appSource.match(/const WHATSAPP_NUMBER\s*=\s*"([^"]*)"/);
  t.check("config: WHATSAPP_NUMBER is declared", Boolean(appNumber), "constant not found in app.js");
  if (appNumber) {
    const digits = appNumber[1].replace(/\D/g, "");
    t.check("config: WHATSAPP_NUMBER is 8-15 digits",
      /^\d{8,15}$/.test(digits), `got ${JSON.stringify(appNumber[1])}`);
    t.equal("config: WHATSAPP_NUMBER matches the runtime validator",
      api.normalizeWhatsAppNumber(appNumber[1]), digits);
    // Note: whether the number is still the reserved `1555…` demo placeholder is
    // deliberately NOT asserted here — shipping the demo template with a demo
    // number is correct. `qa/release-gate.mjs --release` rejects it at delivery
    // time instead, which is where it actually matters.
  }

  const optionValues = [...htmlSource.matchAll(/<select[^>]*>[\s\S]*?<\/select>/g)];
  for (const selectBlock of optionValues) {
    const missing = [...selectBlock[0].matchAll(/<option value="">/g)];
    t.check("config: no <select> offers an empty option value", missing.length === 0);
  }

  /* ---------- 5. HTML structure & accessibility ---------- */
  for (const id of REQUIRED_IDS) {
    t.check(`index.html: #${id} exists`, new RegExp(`id="${id}"`).test(htmlSource));
  }
  t.check("index.html: lang attribute present", /<html\s+lang="/.test(htmlSource));
  t.check("index.html: viewport meta present", /name="viewport"/.test(htmlSource));
  t.check("index.html: meta description present", /name="description"/.test(htmlSource));
  t.check("index.html: og:title present", /property="og:title"/.test(htmlSource));
  t.check("index.html: og:description present", /property="og:description"/.test(htmlSource));
  t.check("index.html: estimate is a live region", /aria-live="polite"/.test(htmlSource));
  t.check("index.html: estimate is atomic", /aria-atomic="true"/.test(htmlSource));
  t.check("index.html: quantity helper is associated", /aria-describedby="qty-help"/.test(htmlSource));
  t.check("index.html: qty input is constrained in markup", /id="qty"[^>]*min="1"[^>]*max="99"/.test(htmlSource));
  t.check("index.html: WhatsApp link has rel=noopener noreferrer", /rel="noopener noreferrer"/.test(htmlSource));
  t.check("index.html: WhatsApp link opens in a new tab", /id="whatsapp"[^>]*target="_blank"/.test(htmlSource));
  t.check("index.html: every <input> has a <label for>", (() => {
    const inputs = [...htmlSource.matchAll(/<input[^>]*id="([^"]+)"/g)].map((m) => m[1]);
    return inputs.every((id) => new RegExp(`<label[^>]*for="${id}"`).test(htmlSource));
  })(), "an input is missing a matching label");
  t.check("index.html: every <select> has a <label for>", (() => {
    const selects = [...htmlSource.matchAll(/<select[^>]*id="([^"]+)"/g)].map((m) => m[1]);
    return selects.every((id) => new RegExp(`<label[^>]*for="${id}"`).test(htmlSource));
  })(), "a select is missing a matching label");

  return t;
}

/* ================================================================== *
 * Self-test — prove the suite has teeth
 * ================================================================== */

/**
 * A suite that cannot fail is worthless. Run the suite against a deliberately
 * broken `app.js` and require that it reports failures. Three independent
 * mutations are used so the check cannot be satisfied by accident.
 */
async function selfTest() {
  const t = makeRunner();

  const mutations = [
    {
      name: "quantity floor removed (Math.max(1, ...) dropped)",
      mutate: (s) => s.replace("Math.min(MAX_QTY, Math.max(MIN_QTY, Math.floor(value)))",
        "Math.min(MAX_QTY, Math.floor(value))")
    },
    {
      name: "URL encoding removed (encodeURIComponent -> String)",
      mutate: (s) => s.replace('"?text=" + encodeURIComponent(text)', '"?text=" + String(text)')
    },
    {
      name: "quote maths broken (multiplier dropped)",
      mutate: (s) => s.replace("Math.round(safeBase * qty * safeMultiplier)", "Math.round(safeBase * qty)")
    }
  ];

  for (const { name, mutate } of mutations) {
    const mutated = mutate(APP_SOURCE);
    t.check(`self-test: mutation is applied — ${name}`, mutated !== APP_SOURCE,
      "mutation target string not found in app.js (is the source already mutated?)");
    if (mutated === APP_SOURCE) continue;

    const result = await runSuite(mutated, HTML_SOURCE);
    t.check(`self-test: suite FAILS on — ${name}`,
      result.failures.length > 0,
      `suite reported ${result.passed.length} passes and 0 failures on broken code`);
  }

  return t;
}

/* ================================================================== *
 * Run everything
 * ================================================================== */

const suite = await runSuite(APP_SOURCE, HTML_SOURCE);
const self = await selfTest();

const report = [
  ["website-001 behaviour + security suite", suite],
  ["suite self-test (mutation resistance)", self]
];

let totalFailures = 0;
for (const [title, result] of report) {
  console.log(`\n${title}`);
  console.log(`  ${result.passed.length} passed, ${result.failures.length} failed`);
  for (const failure of result.failures) {
    totalFailures += 1;
    console.log(`  ✗ ${failure}`);
  }
}

if (totalFailures > 0) {
  console.log(`\nWebsite 001 QA FAILED — ${totalFailures} failing check(s).`);
  process.exit(1);
}

console.log(`\nWebsite 001 QA checks passed (${suite.passed.length + self.passed.length} assertions).`);
