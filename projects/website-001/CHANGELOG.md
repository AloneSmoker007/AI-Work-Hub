# Changelog

## Unreleased

### Added
- **Real QA suite** (`qa/verify.mjs`) that executes the shipped `app.js` through
  `node:vm` against a fake DOM and drives it with `input`/`change` events. 174
  assertions covering pure logic, the 12 canonical quote vectors, DOM
  integration, injection-safety, link integrity, accessibility wiring, and
  configuration validation.
- **Configuration validation** that fails CI loudly instead of letting a
  misconfigured price render as `$0`, `$NaN` or a silently wrong figure on a
  customer's live site. It checks that every service price is finite and
  positive, that each `<option>` label price matches its `value` (the
  `CUSTOMIZE.md` "keep labels and values consistent" hazard), that location
  multipliers are finite and > 0, and that `WHATSAPP_NUMBER` is 8-15 digits and
  agrees with the runtime validator.
- **Mutation self-test** inside the QA suite: it re-runs itself against three
  deliberately broken copies of `app.js` and requires the suite to fail on each.
  A green run now has evidence behind it.
- **Release gate** (`qa/release-gate.mjs`) separating machine-verified checks from
  human/browser verification. CI mode enforces the automated section;
  `--release` enforces everything **plus** delivery-time configuration — it
  rejects the reserved `1555…` demo WhatsApp number and the `QuickQuote` demo
  branding, so a template cannot be handed to a customer without customisation.
- **Favicon** (inline SVG data URI) so the template ships complete.
- `package.json` with `npm test` / `npm run test:release` scripts (no dependencies).
- `.github/dependabot.yml` for `github-actions` and `npm`.
- **Trust boundary** section in `docs/agent-contract.md` covering prompt-injection
  handling, who may change agent instructions, and rules for executing
  repository code in CI.

### Changed
- `site/app.js` restructured so the pure logic (`clampQuantity`, `computeQuote`,
  `formatEstimate`, `normalizeWhatsAppNumber`, `buildWhatsAppUrl`,
  `buildWhatsAppMessage`, `optionLabel`) is separated from a single injectable
  DOM entry point (`initQuickQuote(doc)`).
- **Behaviour verified unchanged.** A differential test compared the new
  `computeQuote` against the original formula over 2,106 input combinations
  (9 services × 9 multipliers × 26 quantity strings): **0 behavioural
  differences** on every finite case, including negative and fractional values.
  Regression assertions covering the same cases are now permanent fixtures in
  `qa/verify.mjs`, so a future refactor that silently clamps or rounds
  differently fails CI.
- WhatsApp number is now validated (`/^\d{8,15}$/` after stripping non-digits).
  An invalid number disables the CTA instead of shipping a dead `wa.me` link.
- Non-finite quote totals now render as `$0` instead of `$NaN` / `$Infinity`.
  This is the **only** intentional behavioural difference from the original
  formula; negative totals are deliberately *not* clamped, so a misconfigured
  price stays visible and is caught by the configuration validation instead.
- CI workflow: actions pinned to full commit SHAs, `permissions` reduced to
  `contents: read` (and `permissions: {}` at workflow level), job-level
  `timeout-minutes`, `concurrency` cancellation, and a guard that stops
  pull requests from forks from executing repository code.

### Fixed
- **QA gate was passing on broken code.** The previous `qa/verify.mjs` read
  `app.js` as a string, asserted on substrings, and ran its arithmetic cases
  against a hand-written copy of the maths that lived inside the test file.
  Removing the `Math.max(1, …)` floor from the quantity clamp still printed
  "QA checks passed." That cannot happen any more — see the mutation self-test.
- `REVIEW.md` / `TASK.md` checkboxes were all unticked while the template was
  already merged. The gate is now split into automated and human sections, with
  evidence recorded for every automated item.

## 0.1.0 — 2026-09-27
- Created initial AI Work Hub project workspace.
- Defined agent responsibilities and release gates.
- Shipped QuickQuote template (`feat(website-001): ship QuickQuote template`, #1).
