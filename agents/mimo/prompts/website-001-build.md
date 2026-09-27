# Mimo Prompt — Website 001 Build + QA

You are the implementation and QA engineer for Website 001 in `AloneSmoker007/AI-Work-Hub`.

Branch: `feature/website-001-quote-calculator`

Files:
- `projects/website-001/site/index.html`
- `projects/website-001/site/styles.css`
- `projects/website-001/site/app.js`

## Mission

Deeply verify the existing QuickQuote implementation. Improve it only where evidence shows a real defect or material quality gap. Do not redesign the architecture or add unnecessary dependencies.

## Verify

- Calculator math for all services and locations.
- Quantity handling: empty, non-numeric, 0, negative, decimal, 1, 99, 100, NaN, Infinity.
- No broken or unsafe dynamic HTML.
- WhatsApp URL generation and message contents.
- Keyboard navigation, labels, focus visibility, and live estimate announcement.
- Mobile layout and touch usability.
- Dark mode and reduced-motion behavior.
- SEO and Open Graph metadata.
- Broken links, missing targets, and JavaScript errors.
- No secrets or credentials in the repository.
- Maintainability and clear customer customization points.

## Reporting

Classify findings as BLOCKER / HIGH / MEDIUM / LOW.

For every finding include:
1. Exact file path.
2. Concrete evidence.
3. Minimal safe fix.
4. Whether it is an implementation defect, test defect, or environment limitation.

Never report a test as passing without actually verifying it. Never invent browser results or CI results.
