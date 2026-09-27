# AI Work Hub

A money-first workspace for building, testing, shipping, and selling websites and small digital products with a coordinated AI workflow.

## Mission

Build useful products quickly, turn them into demos, reach real prospects, get the first payment, then improve and repeat.

## AI roles
- ChatGPT / Luna: product direction, requirements, architecture, security, QA, business strategy, final review.
- Mimo: implementation, tests, debugging, refactoring, technical cleanup.
- Shogo: visual design, UI iteration, prototypes, landing pages and presentation polish.

GitHub is the source of truth. AI outputs are proposals until verified in the repository.

## Repository structure
Each product lives independently under `projects/<product-name>/`.

Typical layout:
```
projects/<product-name>/
├── README.md
├── TASK.md
├── REVIEW.md
├── CHANGELOG.md
├── deployment.md
├── CUSTOMIZE.md
├── site/
└── qa/
```

Keep products lightweight and independently deployable. Add application layers only when the product actually needs them.

## Rules
1. Keep projects independent and deployable.
2. Never commit secrets, API keys, tokens, customer PII, or credentials.
3. Prefer simple, low-cost infrastructure.
4. Every shipped project needs documentation, verification, and deployment notes.
5. Use short-lived feature branches and pull requests for meaningful changes.
6. Do not modify Nova-AI from this repository. Nova-AI is a separate product.
7. Keep customer-specific credentials and production configuration out of reusable templates.

## Verification standard
A project is verified only when applicable checks have evidence in the repository or CI:
- Static/code checks and repeatable QA pass.
- Relevant boundary and failure cases pass.
- Security-sensitive behavior is reviewed.
- Documentation matches the shipped code.
- Browser/mobile QA is completed for user-facing web products, or explicitly marked PENDING when tooling is unavailable.

Verification is not the same as commercial release. Release additionally requires deployment, customer configuration, and delivery checks.

## Security baseline
Review the controls that apply to each product:
- Validate and constrain user input.
- Avoid unsafe HTML/DOM injection and unsafe URL construction.
- Keep secrets out of source control.
- Use least privilege and customer/tenant isolation where applicable.
- Add rate limiting when an API needs abuse protection.
- Review authentication, authorization, sessions/tokens, and sensitive data storage when applicable.
- Review third-party dependencies and remove unnecessary ones.
- Define retention/deletion expectations when user or customer data is collected.

Use the lightest control that fits the product; do not overbuild security infrastructure.

## Products
| Product | Status | Demo / Deploy | Revenue |
|---|---|---|---|
| Website 001 — QuickQuote | Building / release-gated | See project docs | — |

Suggested status values: `idea`, `building`, `shipped`, `earning`. Revenue is recorded only when verified.

## Workflow
Idea -> offer -> specification -> implementation -> visual polish -> QA/security -> deploy -> demo -> outreach -> payment -> delivery -> maintenance.

Payment providers are chosen per product/customer and jurisdiction; do not hard-code one into the workspace without a real requirement. Before delivery, confirm scope, price, payment status, domain, WhatsApp/contact destination, and deployment ownership. Keep customer credentials outside reusable templates.

## Licensing
No customer-facing license or source-transfer terms are assumed by this workspace. Before selling or transferring source code, choose and document the applicable ownership/license terms for that product.

## Success metric
The primary early metric is real customer revenue, not repository size or feature count.
