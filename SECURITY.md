# Security policy

## Supported scope

This repository contains the DoOnce frontend and local browser-extension alpha. It is public source code, not a deployed service. Do not use it with real customer data or production credentials.

## Reporting a vulnerability

Please do not publish secrets, proof-of-concept details, captured data, or exploit steps in a public issue. Use GitHub's private vulnerability-reporting feature for this repository when it is available. If it is unavailable, open a minimal issue requesting a private reporting channel without including sensitive details.

## Before publishing a contribution

- Never commit `.env` files, tokens, API keys, database URLs, private keys, or real browser captures/receipts.
- Treat every `NEXT_PUBLIC_*` value as visible to anyone using the frontend.
- Keep the local demo boundary intact: no automatic uploads, broad host permissions, or browser-action authority without a reviewed security design.
