# Deployment Notes

## Requirements
Document the hosting provider, build command, output directory, domain, environment variables, and rollback procedure before launch.

## Rules
- Prefer low-cost infrastructure for early validation.
- Never commit production secrets.
- Keep deployment reproducible.
- Verify the live site on mobile and desktop after deployment.
- Record the live URL here after launch.

## Pre-launch checklist
- [ ] Production build succeeds
- [ ] Environment variables configured securely
- [ ] HTTPS enabled
- [ ] Domain configured if applicable
- [ ] WhatsApp CTA tested
- [ ] Forms tested
- [ ] Privacy requirements reviewed
- [ ] Rollback path known
