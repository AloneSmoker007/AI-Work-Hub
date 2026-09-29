# Website 001 — Customization Guide

## QuickQuote Template

Before customer delivery, replace every demo value with the customer's real business information.

### Required changes

1. **WhatsApp number**
   - File: `site/app.js`
   - Replace `WHATSAPP_NUMBER` with the business WhatsApp number in international format, digits only.
   - Never commit API keys, access tokens, passwords, or other secrets.

2. **Services and prices**
   - File: `site/app.js`
   - Update the service options in `site/index.html` and matching base prices in `site/app.js`.
   - Keep the displayed labels and numeric values consistent.

3. **Location pricing**
   - File: `site/index.html` and `site/app.js`
   - Adjust local/nearby/outside-area multipliers to the customer's actual pricing rules.

4. **Branding and copy**
   - File: `site/index.html`
   - Replace QuickQuote branding, headline, supporting copy, offer text, footer, and business-specific wording.
   - Remove any statement that is not true for the customer.

5. **SEO/social metadata**
   - File: `site/index.html`
   - Replace the title, meta description, and Open Graph text with customer-specific copy.

### Final checks

- Run the project's verification suite first:
  `npm test` in `projects/website-001/` (or `node qa/verify.mjs`).
  It executes the real `app.js` against a fake DOM and covers quantity edge
  cases, the WhatsApp deep link, injection safety, link integrity, and
  accessibility wiring.
- Test quantity values 1, 99, 100, 0, negative, empty, decimal, and non-numeric input.
- Confirm the estimate never becomes NaN or Infinity.
- Confirm the WhatsApp message contains the selected service, quantity, location, and estimate.
- **Confirm `WHATSAPP_NUMBER` is the customer's real number** — it is validated as
  8–15 digits after stripping non-digits. An invalid number disables the CTA
  rather than shipping a dead `wa.me` link, so check the button still works.
- Test keyboard navigation and visible focus.
- Test a narrow mobile viewport.
- Test dark mode and reduced-motion preferences.
- Confirm all links and buttons work.
- Run `node qa/release-gate.mjs --release` before delivery. It will refuse to
  pass until the human/browser checklist in `REVIEW.md` is ticked — that is
  deliberate. Do not tick those boxes without doing the pass.
