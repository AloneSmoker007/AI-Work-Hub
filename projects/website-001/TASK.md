# Website 001 — Task

## Objective
Turn the first website concept into a reusable, polished, deployable template that can be customized for a real customer.

## Acceptance criteria

### Done (verified by CI — see `REVIEW.md` for evidence)
- [x] Mobile-first responsive layout — `styles.css` `@media (max-width: 800px)` single-column rules
- [x] Clear niche-specific value proposition — hero copy + `og:description`
- [x] Primary WhatsApp CTA — `#whatsapp` deep link, built and asserted end to end
- [x] Lead/contact capture path — pre-filled WhatsApp message carries service, quantity, location, estimate
- [x] Services or packages section — `#offer` + calculator service options
- [x] Trust/social-proof section — `#how` + trust badges (no fabricated testimonials or statistics)
- [x] Clear offer/pricing or contact CTA — `#offer` price card + `#calculator`
- [x] SEO title and meta description — asserted structurally
- [x] Open Graph metadata — `og:title`, `og:description`, `og:type` asserted
- [x] Accessibility basics — `aria-live`, `aria-atomic`, `aria-describedby`, `lang`, viewport, `<label for>` wiring asserted
- [x] Fast-loading assets — zero dependencies, zero images, zero third-party requests
- [x] No secrets in repository — forbidden-pattern suite + full git-history blob scan
- [x] Build/test checks pass — `node --check` + `qa/verify.mjs` (174 assertions incl. mutation self-test)
- [x] Deployment instructions documented — `deployment.md`
- [x] Customer customization points documented — `CUSTOMIZE.md`
- [x] Favicon — inline SVG data URI, asserted present

### Remaining (needs a human — blocked on the release gate)
- [ ] Browser/device pass: mobile, desktop, keyboard, focus, dark mode, reduced motion
- [ ] Target niche selected and offer/price hypothesis documented
- [ ] Demo URL deployed and recorded in `deployment.md`
- [ ] Outreach list started
- [ ] Delivery/maintenance offer defined

## Workflow
1. Luna defines requirements.
2. Mimo implements and verifies technical behavior.
3. Shogo polishes visual/UI quality.
4. Luna performs final QA and release review.
5. Publish demo and begin outreach.

## Notes for whoever picks this up next

- `node qa/verify.mjs` runs the **real** `app.js` through `node:vm` against a fake
  DOM. It does not assert on source text and it does not use a copied
  implementation. If you change the logic in `app.js`, the tests exercise the
  changed logic automatically.
- The suite is self-testing: it deliberately re-runs itself against three mutated
  copies of `app.js` and requires that it fails on each. Do not weaken or remove
  that section — it is what makes a green run meaningful.
- `node qa/release-gate.mjs --release` is the delivery gate. CI runs the same
  script without `--release`, so the build can be green while the product is
  still honestly marked "not signed off".
