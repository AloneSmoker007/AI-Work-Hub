# Delivery & Maintenance Offer — Astrologers (DRAFT / UNVALIDATED)

> **Status: draft hypothesis** for the first paid pilot. Pricing here is not a
> validated market fact — see `offer-hypothesis.md`. Confirm scope, price,
> payment, WhatsApp destination and deployment ownership with a human before
> any delivery (per `docs/agent-contract.md`).

## One-time setup & customization (hypothesis: $150–$300)

Included:

1. Branding — astrologer's name, logo/colour, headline and footer copy.
2. Services & prices — their actual readings, prices and consultation modes
   wired into the calculator (labels and numeric values kept consistent).
3. WhatsApp CTA — their real WhatsApp number (international format, digits
   only), tested end to end on the live URL.
4. SEO / social metadata — title, description and Open Graph text for their
   niche and language.
5. Deployment — GitHub Pages (or equivalent low-cost static hosting) with the
   live URL recorded in `deployment.md`.
6. QA — `qa/verify.mjs` green + the browser/device pass, with evidence. The
   release gate (`node qa/release-gate.mjs --release`) must pass before the
   site is called delivered.

Not included (quote separately):

- Custom backend, accounts, payments, booking calendar (v2 ideas).
- Content writing beyond copy edits of the template.
- Logo design, photography, video.
- Multi-language versions.

## Optional maintenance (hypothesis: $20–$40 / month)

- Price and copy updates (up to N small edits / month — propose N=3).
- Keeping CI green (dependency bumps via PRs, same process as this repo).
- Monitoring the live URL after hosting changes.
- Re-running the QA + release gate after each change.

## Delivery checklist (per customer)

- [ ] Scope, price and payment terms confirmed by a human
- [ ] Real WhatsApp number installed and tested (`CUSTOMIZE.md` step 1)
- [ ] Prices/multipliers match the astrologer's actual pricing rules
- [ ] Branding/copy/SEO replaced (no template/demo branding left)
- [ ] `node qa/verify.mjs` green on the delivered files
- [ ] Browser/device pass done and `REVIEW.md` human boxes ticked honestly
- [ ] `node qa/release-gate.mjs --release` passes
- [ ] Live URL + evidence recorded in `deployment.md`
- [ ] Customer has deployment ownership/rollback documented

## Payment hypothesis (unvalidated)

- 50% upfront, 50% on delivery for one-time setups.
- Maintenance billed monthly, cancel anytime.
- Do not start work without a human confirming scope and price.

## Risk notes

- The demo ships with the reserved `1555…` placeholder number on purpose; the
  release gate refuses delivery until the customer's real number is in place.
- Never commit customer numbers/PII into public repositories — if the customer
  repo must stay private, say so before delivery.
