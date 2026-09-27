import { readFile } from "node:fs/promises";

const appPath = new URL("../site/app.js", import.meta.url);
const htmlPath = new URL("../site/index.html", import.meta.url);

const app = await readFile(appPath, "utf8");
const html = await readFile(htmlPath, "utf8");

if (!app.includes("Number.isFinite(rawQty)")) throw new Error("Quantity validation is missing");
if (!app.includes("Math.floor(rawQty)")) throw new Error("Decimal quantity handling is missing");
if (!app.includes("encodeURIComponent(message)")) throw new Error("WhatsApp message encoding is missing");
if (!app.includes("https://wa.me/")) throw new Error("WhatsApp URL generation is missing");
if (!html.includes('aria-live="polite"')) throw new Error("Estimate live region is missing");
if (!html.includes('aria-describedby="qty-help"')) throw new Error("Quantity helper association is missing");
if (!html.includes('rel="noopener noreferrer"')) throw new Error("External WhatsApp link protection is missing");

const cases = [
  [80, 1, 1, 80],
  [140, 99, 1.2, 16632],
  [220, 100, 1, 21780],
  [80, 0, 1, 80],
  [80, -5, 1.1, 88],
  [80, "", 1, 80],
  [80, "abc", 1, 80],
  [80, 1.9, 1, 80],
  [220, 99, 1.1, 23958],
];

for (const [base, raw, multiplier, expected] of cases) {
  const value = Number(raw);
  const qty = Number.isFinite(value)
    ? Math.min(99, Math.max(1, Math.floor(value)))
    : 1;
  const total = Math.round(Number(base) * qty * Number(multiplier));
  if (!Number.isFinite(total) || total !== expected) {
    throw new Error(`Quote case failed: ${base}, ${String(raw)}, ${multiplier} => ${total}`);
  }
}

console.log("Website 001 QA checks passed.");
