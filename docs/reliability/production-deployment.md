# Dashboard and extension production deployment

## Dashboard

1. Set `NEXT_PUBLIC_API_BASE_URL` to the public HTTPS API origin before the production build. It becomes part of the browser bundle and Content Security Policy, so it must never contain credentials.
2. Build one immutable image and retain its digest, Git commit, SBOM, audit result, and container scan result.
3. Deploy behind TLS with health checks and a rolling strategy. The standalone Next.js image runs as a non-root user and contains only traced runtime files.
4. Verify HSTS, CSP, Permissions Policy, frame denial, referrer policy, and content-type protection on the deployed response.
5. Exercise sign-in, workflow list, one progressive editor review, one test run, and error recovery at desktop and mobile widths.
6. Roll back by redeploying the prior image digest. The dashboard owns no database migration and must remain compatible with both API versions during a rolling release.

Global and route error boundaries show a content-free retry state. They log only a framework digest, never page content, workflow input, or raw API response.

## Extension

Follow the backend operations handbook’s extension release and browser compatibility procedure. Keep host access optional and user-granted; any manifest permission change requires an explicit diff review and a plain-language release note. Build artifacts and controlled-run evidence must come from the same commit.

## Release evidence

- dashboard and extension SBOMs;
- dependency and container scan results;
- production response-header capture;
- controlled 50-run replay report;
- stable/current and previous-stable Chrome results;
- responsive screenshots at 390 px and 1440 px;
- image and extension package checksums;
- rollback owner and prior artifact identifiers.
