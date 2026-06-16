# R24 — Port `/api/oidc` (login via external IdP)

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 2600–2699
**Blocked by:** none
**Blocks:** none

## Goal

OIDC login (SSO) so users can sign in via an external IdP (Google,
Authentik, Keycloak…). Server is the OIDC *client*.

## Scope

- [ ] Port OIDC migrations (config, session storage).
- [ ] `worker/src/routes/oidc.ts`: discovery, authorize-redirect,
      callback, logout.
- [ ] Use `openid-client`. If its Node-specific deps leak in, fall back
      to a hand-rolled OIDC flow with `jose` (per PRD §"Risk callouts").
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/oidc.ts` (164 lines)
- Service: `server/src/services/oidcService.ts`

## Done-when

Configure an Authentik test client; sign in via Authentik on the dev
Worker; `GET /api/auth/me` returns the user.
