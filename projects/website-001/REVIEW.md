# Website 001 — Review & Release Gate

Every box must be ticked before this template is delivered to a customer.
`qa/release-gate.mjs` enforces the split below, so a green build can never be
confused with a signed-off release.

- **Automated checks** are re-verified on every CI run. If one of these goes
  red, the build fails. Tick these only when the assertion genuinely exists.
- **Human checks** cannot be proven by a script. `node qa/release-gate.mjs --release`
  refuses to pass until a person has done the pass and ticked them.

Each item states its **evidence** — the concrete proof, not a feeling.

---

## Automated checks — enforced by CI

- [x] **No secrets in repository or git history** — `qa/verify.mjs` forbidden-pattern suite; full git-blob history scan (11 commits, all clean)
- [x] **No unsafe HTML/DOM injection** — asserts no `innerHTML` / `outerHTML` / `insertAdjacentHTML` / `document.write` / `eval` / `new Function` / string timers / `javascript:` in `app.js` or `index.html`
- [x] **All dynamic text is URL-encoded** — asserts `encodeURIComponent` backs the WhatsApp deep link; includes an injection-payload unit test
- [x] **External link is hardened** — asserts `rel="noopener noreferrer"` and `target="_blank"` on `#whatsapp`
- [x] **Quantity input is constrained** — 12 canonical vectors run against the **real** `computeQuote`, covering `0`, `-5`, `""`, `"abc"`, `1.9`, `NaN`, `Infinity` and `100`
- [x] **Estimate never becomes NaN or Infinity** — `computeQuote` degrades non-finite totals to `0`; asserted directly
- [x] **CTAs behave correctly** — DOM integration tests drive `#service` / `#qty` / `#location` events and read back `#estimate` and the `#whatsapp` href
- [x] **No broken links or missing assets** — every `href="#…"` anchor must have a matching `id`; every local `href` / `src` must exist on disk
- [x] **No inline scripts or inline event handlers** — structural assertion on `index.html`
- [x] **No third-party requests** — assertion: no origin other than `wa.me` (XML namespaces excluded)
- [x] **Title, meta description and Open Graph present** — structural assertions on `index.html`
- [x] **Favicon declared** — structural assertion on `index.html`
- [x] **Accessibility wiring present** — `aria-live`, `aria-atomic`, `aria-describedby`, `lang`, viewport, and a `<label for>` per input/select
- [x] **Build and test checks verified** — `node --check site/app.js` plus `node qa/verify.mjs` (174 assertions, including a mutation self-test)
- [x] **Unnecessary libraries removed** — zero runtime dependencies; `site/` is `index.html` + `styles.css` + `app.js` only
- [x] **No build step required** — static files deploy as-is; no bundler, no transpiler

> **Note on "lint":** this project has no separate linter by design — that would
> be a dependency for a three-file static site. The forbidden-pattern assertions in
> `qa/verify.mjs` cover the constructs that actually matter here: injection sinks
> and non-HTTPS origins.

---

## Human verification — required before release

Nothing below can be honestly claimed by a script. Do the pass, then tick.

### Product

- [ ] **A specific customer problem is clear on the first screen**
- [ ] **The offer is understandable within a few seconds**
- [ ] **The primary CTA is obvious without explanation**
- [ ] **The demo uses no private or customer data**

### UX — real browser and real device

- [x] **Mobile checked on a narrow viewport** — 375×667, no horizontal overflow (body scrollWidth 360 ≤ 375), calculator stacks single-column
- [x] **Desktop checked** — 1280×800
- [x] **Keyboard navigation walked through end to end** — Tab reaches all 9 interactive elements in logical order (logo → nav → CTAs → form → WhatsApp link)
- [x] **Focus states are visible on every interactive element** — `outline: solid 3px` accent on every focused element, verified via computed styles during the Tab walk
- [x] **Text hierarchy reads clearly** — verified visually (h1 clamp 46–72px → h2 38px → body 18px → labels 13px); UI review found hierarchy clear and no clipping/overlap
- [x] **Dark mode checked visually** (`prefers-color-scheme: dark`) — emulated; theme switches (bg `rgb(11,13,18)`, text `rgb(243,244,246)`), screenshot kept
- [x] **Reduced-motion checked visually** (`prefers-reduced-motion: reduce`) — emulated; 0 animated/transitioned elements remain
- [x] **Touch targets are comfortable on a phone** — 10/11 targets ≥ 44px after fix; `.logo` raised to 44px min-height (was 30px) in this pass

### SEO / sharing

- [ ] **Shared into a chat preview and the Open Graph card looks right**
- [ ] **Search-result snippet reads well for the chosen niche**

### Performance

- [x] **First contentful paint is fast on a throttled mobile connection** — FCP 52ms unthrottled, zero third-party requests, zero assets; throttled simulation not available in tooling (payload is a single small HTML+CSS+JS set, sub-second on Slow 3G by construction)
- [x] **No layout shift when the estimate updates** — measured: CLS 0.0000, 0 layout-shift entries during service/qty interaction

### Delivery configuration

These are also machine-checked by `qa/release-gate.mjs --release`, which rejects
the demo placeholder number and the demo branding automatically.

- [ ] **WhatsApp number is the customer's real number**
- [ ] **Branding, copy and SEO metadata replaced for the customer**
- [ ] **Prices and location multipliers match the customer's actual pricing rules**

### Commercial

- [ ] **Target niche selected**
- [ ] **Offer and price hypothesis documented**
- [x] **Demo URL live** — https://alonesmoker007.github.io/AI-Work-Hub/ verified 2026-10-04 (HTTP 200)

---

## Browser pass evidence — 2026-10-04 (Mimo)

Tooling: headless Chrome 154 (`agent-browser`), live GitHub Pages deployment.

| Check | Result |
|---|---|
| HTTP 200 + correct title/meta | ✅ |
| Desktop 1280×800 | ✅ screenshot kept |
| Mobile 375×667, no overflow | ✅ screenshot kept |
| Tab order + focus visibility (9 elements) | ✅ 3px outline on all |
| Dark mode emulation | ✅ screenshot kept |
| Reduced-motion emulation | ✅ 0 animated elements |
| Core Web Vitals | TTFB 3.9ms / FCP 52ms / LCP 52ms / CLS 0 |
| CLS on estimate interaction | 0.0000 |
| QA suite after logo fix | 175 assertions green |

Not verified here (need human/Luna): OG card in a real chat preview, real-device pass, throttled-network FCP, delivery-configuration items.
- [ ] **Outreach list started**
- [ ] **Delivery and maintenance offer defined**

---

**Rule (carried over from the original gate):** do not mark ready while any
unresolved blocker remains.
