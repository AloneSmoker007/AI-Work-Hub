/**
 * Website 001 — release gate.
 *
 * `REVIEW.md` splits its checklist into two sections:
 *
 *   "Automated checks — enforced by CI"
 *       Re-verified by `qa/verify.mjs` on every run. This script requires them
 *       to be ticked at all times, so a stale checkbox cannot hide a regression.
 *
 *   "Human verification — required before release"
 *       Real browser/device/commercial work that no script can prove. This
 *       script only enforces them when `--release` (or `RELEASE_GATE=1`) is set,
 *       so day-to-day CI stays green without anyone faking a browser pass.
 *
 * Run with `--release` from a tag, a `workflow_dispatch`, or before delivery.
 * Zero dependencies. Requires Node 18+.
 */

import { readFile } from "node:fs/promises";

const RELEASE_MODE = process.argv.includes("--release") || process.env.RELEASE_GATE === "1";

const reviewUrl = new URL("../REVIEW.md", import.meta.url);
const REVIEW = await readFile(reviewUrl, "utf8");

const AUTOMATED_PREFIX = "Automated checks";
const HUMAN_PREFIX = "Human verification";

/* ---------- parse REVIEW.md into { header: { ticked, total, items } } ----- */

function parseSections(markdown) {
  const sections = new Map();
  let current = null;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1];
      sections.set(current, { ticked: 0, total: 0, items: [] });
      continue;
    }
    if (!current) continue;

    // Matches a GitHub task-list item: `- [x] **Title** — evidence`.
    const box = line.match(/^- \[( |x|X)\] \*\*(.+?)\*\*/);
    if (box) {
      const entry = sections.get(current);
      entry.total += 1;
      const done = box[1].toLowerCase() === "x";
      if (done) entry.ticked += 1;
      entry.items.push({ done, label: box[2].trim() });
      continue;
    }

    // Fallback for un-bolded task items, so the gate still works if the
    // formatting is changed later.
    const plain = line.match(/^- \[( |x|X)\] (.+)$/);
    if (plain) {
      const entry = sections.get(current);
      entry.total += 1;
      const done = plain[1].toLowerCase() === "x";
      if (done) entry.ticked += 1;
      entry.items.push({ done, label: plain[2].split(" — ")[0].trim() });
    }
  }

  return sections;
}

const sections = parseSections(REVIEW);

const find = (prefix) => {
  for (const [header, data] of sections) {
    if (header.startsWith(prefix)) return { header, ...data };
  }
  return null;
};

const automated = find(AUTOMATED_PREFIX);
const human = find(HUMAN_PREFIX);

const problems = [];

if (!automated) {
  problems.push(`REVIEW.md has no section starting with "${AUTOMATED_PREFIX}"`);
}
if (!human) {
  problems.push(`REVIEW.md has no section starting with "${HUMAN_PREFIX}"`);
}

if (automated && automated.total === 0) {
  problems.push(`"${automated.header}" contains no checklist items`);
}

if (automated) {
  for (const item of automated.items) {
    if (!item.done) {
      problems.push(`[automated, always enforced] unticked: ${item.label}`);
    }
  }
}

if (human && human.total === 0) {
  problems.push(`"${human.header}" contains no checklist items`);
}

if (RELEASE_MODE && human) {
  for (const item of human.items) {
    if (!item.done) {
      problems.push(`[human, release enforced] unticked: ${item.label}`);
    }
  }
}

/* ------------------ delivery-time configuration checks -------------------
 * Machine-checkable, but only meaningful at delivery. Running these on every
 * CI build would keep the build permanently red on a template that is
 * *supposed* to ship with demo values.
 */

if (RELEASE_MODE) {
  const appUrl = new URL("../site/app.js", import.meta.url);
  const htmlUrl = new URL("../site/index.html", import.meta.url);
  const [appSource, htmlSource] = await Promise.all([
    readFile(appUrl, "utf8"),
    readFile(htmlUrl, "utf8")
  ]);

  const numberMatch = appSource.match(/const WHATSAPP_NUMBER\s*=\s*"([^"]*)"/);
  if (!numberMatch) {
    problems.push("[delivery] WHATSAPP_NUMBER is not declared in site/app.js");
  } else {
    const digits = numberMatch[1].replace(/\D/g, "");
    if (!/^\d{8,15}$/.test(digits)) {
      problems.push(`[delivery] WHATSAPP_NUMBER is not 8-15 digits: ${JSON.stringify(numberMatch[1])}`);
    }
    if (/^1555/.test(digits)) {
      problems.push(
        "[delivery] WHATSAPP_NUMBER is still the reserved 1555 demo placeholder — " +
          "replace it with the customer's real WhatsApp number (CUSTOMIZE.md)"
      );
    }
  }

  if (/QuickQuote/i.test(htmlSource)) {
    problems.push(
      "[delivery] index.html still contains the 'QuickQuote' demo branding — " +
        "replace branding, copy and SEO metadata (CUSTOMIZE.md)"
    );
  }
}

/* --------------------------------- report -------------------------------- */

const summarise = (section) =>
  section ? `${section.ticked}/${section.total} ticked` : "section missing";

console.log(`Website 001 release gate (${RELEASE_MODE ? "RELEASE mode" : "CI mode"})`);
console.log(`  automated : ${summarise(automated)}`);
console.log(`  human     : ${summarise(human)}`);

if (problems.length > 0) {
  console.log("\nRelease gate FAILED:");
  for (const problem of problems) console.log(`  ✗ ${problem}`);
  if (!RELEASE_MODE && human && human.ticked < human.total) {
    console.log(
      `\n  ${human.total - human.ticked} human check(s) are still open. ` +
        "Run the real browser/device pass and tick them in REVIEW.md, then\n" +
        "  run `node qa/release-gate.mjs --release` before delivering to a customer."
    );
  }
  process.exit(1);
}

if (RELEASE_MODE) {
  console.log("\nRelease gate passed — automated and human checks are both signed off.");
} else {
  console.log("\nRelease gate passed for CI (automated checks signed off).");
}
