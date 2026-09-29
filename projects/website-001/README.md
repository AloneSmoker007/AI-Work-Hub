# Website 001 — WhatsApp Lead Website

## Goal
Create a reusable, customer-ready website template for small businesses that receive leads through WhatsApp.

## Target niches
Coaches, salons, clinics, real-estate agents, astrologers, local services, and other ad-driven businesses.

## Core offer
Fast mobile-first landing website with a strong WhatsApp call-to-action, lead capture path, services, social proof, basic SEO, and deployment.

## Revenue model
Start with a one-time setup/customization sale. Offer optional maintenance or recurring improvements after delivery.

## Status
Shipped as a working template (`feat(website-001): ship QuickQuote template`, #1)
and hardened since:

- Behaviour is covered by a zero-dependency suite that runs the real `app.js`
  against a fake DOM (`qa/verify.mjs`, 174 assertions).
- The suite is mutation-tested against itself, so a green run is evidence.
- The release gate separates machine-verified checks from human/browser
  sign-off (`qa/release-gate.mjs`, `--release` for delivery).

**Not yet signed off for delivery:** the human/browser pass in `REVIEW.md`
(mobile, desktop, keyboard, focus, dark mode, reduced motion) and the commercial
items (niche, offer, demo URL, outreach list). See `TASK.md`.
