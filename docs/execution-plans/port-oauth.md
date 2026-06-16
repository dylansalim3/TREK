# R23 — Port `/api/oauth` + OAuth 2.1 endpoints

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 2500–2599
**Blocked by:** none
**Blocks:** none

## Goal

OAuth 2.1 with PKCE: authorize/validate, consent submission, token
exchange, dynamic client registration, revoke. Plus client/session
management endpoints.

## Scope

- [ ] Port OAuth migrations (`oauth_clients`, `oauth_authorizations`,
      `oauth_access_tokens`, `oauth_refresh_tokens`).
- [ ] `worker/src/routes/oauth.ts`: implement the OAuth 2.1 spec by hand
      using `jose` for JWTs and the Web Crypto API for PKCE verification.
- [ ] Mount at both `/api/oauth/*` (auth) and top-level `/oauth/*`
      (token, register, revoke, authorize, .well-known).
- [ ] Port tests.

## Source references

- Route: `server/src/routes/oauth.ts` (415 lines)
- Service: `server/src/services/oauthService.ts`
- Spec: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1

## Done-when

Authorization-code-with-PKCE flow works end-to-end: register a client,
hit `/oauth/authorize` from a browser, exchange code for token at
`/oauth/token`, call `/api/auth/me` with the bearer token.
