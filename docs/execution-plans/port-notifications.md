# R20 — Port `/api/notifications`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 2200–2299
**Blocked by:** none (email test endpoint stubs `501` until F2 ships)
**Blocks:** none

## Goal

Notification preferences (email, webhook, ntfy) and in-app notification
inbox (list, mark read/unread, delete, respond).

## Scope

- [ ] Port notification migrations (`notification_preferences`,
      `in_app_notifications`).
- [ ] `worker/src/routes/notifications.ts`: preferences + test endpoints
      (test-smtp, test-webhook, test-ntfy).
- [ ] `worker/src/routes/inAppNotifications.ts`: inbox CRUD under
      `/api/notifications/in-app`.
- [ ] Test-SMTP: until F2 lands, return `501 EMAIL_NOT_CONFIGURED`. After
      F2 lands, call `sendEmail()`.
- [ ] Mount, unstub, port tests.

## Source references

- Route: `server/src/routes/notifications.ts` (153 lines)
- Service: `server/src/services/inAppNotifications.ts`,
  `server/src/services/notifications.ts`

## Done-when

Create an in-app notification (via admin test endpoint), list it as
target user, mark read.
