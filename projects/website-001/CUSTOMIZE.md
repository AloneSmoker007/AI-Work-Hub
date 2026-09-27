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

- Test quantity values 1, 99, 100, 0, negative, empty, decimal, and non-numeric input.
- Confirm the estimate never becomes NaN or Infinity.
- Confirm the WhatsApp message contains the selected service, quantity, location, and estimate.
- Test keyboard navigation and visible focus.
- Test a narrow mobile viewport.
- Test dark mode and reduced-motion preferences.
- Confirm all links and buttons work.
- Confirm the real WhatsApp number is present before delivery.
- Run the project's available build/test/lint checks before release.
