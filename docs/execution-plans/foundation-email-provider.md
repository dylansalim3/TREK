# F2 — Email provider (Resend / MailChannels)

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** —
**Blocked by:** none
**Blocks:** none

## Goal

Replace `nodemailer` (won't run on Workers) with an HTTP-based provider so
password-reset, invite, and notification emails ship from the Worker.

## Scope

- [ ] `worker/src/services/email.ts` exporting `sendEmail({ to, subject, html, text })`.
- [ ] Read `EMAIL_PROVIDER` env var: `'mailchannels'` (default) or `'resend'`.
- [ ] MailChannels: POST to `https://api.mailchannels.net/tx/v1/send` — no
      API key needed from Cloudflare Workers (free).
- [ ] Resend: POST to `https://api.resend.com/emails`, auth via
      `RESEND_API_KEY` secret (`wrangler secret put`).
- [ ] Mock `fetch` in tests, assert the right URL + body + headers.
- [ ] Update `worker/README.md` "Secrets" section to list `RESEND_API_KEY`
      and any provider-specific config (`EMAIL_FROM`, etc).

## Source references

- Express implementation: `server/src/services/notifications.ts`
  (`sendEmail`)
- Use of email: `forgotPassword`, `resetPassword`, invite flow,
  trip-member-added notifications, weather alerts.

## Done-when

`sendEmail` unit test passes with mocked `fetch` and a manual call from a
deployed dev Worker (`wrangler tail --env dev`) successfully sends a test
email.
