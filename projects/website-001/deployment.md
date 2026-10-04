# Deployment Notes

## Requirements
Document the hosting provider, build command, output directory, domain, environment variables, and rollback procedure before launch.

## Rules
- Prefer low-cost infrastructure for early validation.
- Never commit production secrets.
- Keep deployment reproducible.
- Verify the live site on mobile and desktop after deployment.
- Record the live URL here after launch.

## Live demo
- **URL: https://alonesmoker007.github.io/AI-Work-Hub/** (GitHub Pages, HTTPS enforced)
- Verified live on 2026-10-04 (Mimo browser pass, headless Chrome 154):
  - HTTP 200, title/meta load correctly
  - Desktop 1280×800 and mobile 375×667 render correctly, no horizontal overflow
  - Core Web Vitals: TTFB 3.9ms, FCP 52ms, LCP 52ms, CLS 0 (0.0000 also on estimate interaction)
  - Keyboard: all 9 interactive elements reachable via Tab; focus outline (3px) visible on every one
  - `prefers-color-scheme: dark` verified visually; `prefers-reduced-motion` disables all motion (0 animated elements)
  - Evidence screenshots: kept in the audit workspace (`runs/ai-work-hub-website001/screenshots/`)
- Rollback path: GitHub Pages deploys from `main` — rollback = revert the commit on `main`; the deploy workflow re-publishes the previous state.

## Pre-launch checklist
- [x] Production build succeeds — static site, no build step; `node --check` + QA suite green (175 assertions)
- [x] Environment variables configured securely — N/A: zero dependencies, zero env vars
- [x] HTTPS enabled — enforced by GitHub Pages
- [ ] Domain configured if applicable — N/A for the demo (no custom domain configured)
- [ ] WhatsApp CTA tested — deep link structure asserted end-to-end in QA; live send pending the customer's real number (release gate blocks the demo placeholder)
- [x] Forms tested — calculator exercised against the real `app.js` by the QA suite
- [ ] Privacy requirements reviewed — pending (needed before real prospect data)
- [x] Rollback path known — revert commit on `main` (see above)
