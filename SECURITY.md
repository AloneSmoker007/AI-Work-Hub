# Security Baseline

Use a lightweight security review appropriate to each product.

## Checklist
- Validate and constrain user-controlled input.
- Prevent unsafe HTML/DOM injection and unsafe URL construction.
- Never commit secrets, API keys, tokens, credentials, or customer PII.
- Use least privilege and isolate customer/tenant data where applicable.
- Review authentication, authorization, sessions, and token handling when applicable.
- Add rate limiting and abuse controls when an API is exposed.
- Review dependencies and remove unnecessary packages.
- Define retention and deletion expectations for collected data.
- Verify external integrations and production configuration before delivery.

Do not add security infrastructure merely to satisfy a checklist.

## Reporting
Do not publish credentials, tokens, or private customer information in issues or pull requests. Handle sensitive security findings privately and remove exposed access before documenting non-sensitive lessons.
