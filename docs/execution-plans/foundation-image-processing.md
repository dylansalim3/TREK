# F3 — Image processing via Cloudflare Images

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** —
**Blocked by:** none
**Blocks:** none

## Goal

`jimp` is a native Node module; replace its avatar / cover / thumbnail use
with Cloudflare Images Transformations on R2-backed images.

## Scope

- [ ] `worker/src/services/images.ts` exporting:
  - `getResizedUrl(r2Key: string, opts: { width?: number; height?: number; fit?: 'cover' | 'contain'; format?: 'webp' | 'auto' })`
  - Uses CF Images URL-based transformations:
    `https://<account>/cdn-cgi/image/<opts>/<origin-url>`.
- [ ] Update `worker/src/routes/files.ts` (and the avatar/cover handlers
      under `auth.ts` / `trips.ts` in their respective plans) to call
      `getResizedUrl()` instead of inline jimp.
- [ ] Document in `worker/README.md` that the Cloudflare Images product
      must be enabled on the account.

## Source references

- Express implementation: `server/src/services/imageProcessing.ts`
- Use sites: avatar upload, trip cover upload, journey photo thumbnails.

## Done-when

A trip cover uploaded to the dev Worker, fetched via the resized URL,
returns a `200` with `content-type: image/webp` at the requested width.
