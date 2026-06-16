# R19 — Port `/api/photos` + `/api/memories`

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** 2100–2199
**Blocked by:** none (works without F3 — thumbnails skip resizing until F3 ships)
**Blocks:** none

## Goal

Photo upload/list/delete, plus the "memories" tab (auto-generated photo
albums per trip-day).

## Scope

- [ ] Port photo/memories migrations.
- [ ] `worker/src/routes/photos.ts`: upload to R2, record in
      `trip_photos`, return signed/public URL.
- [ ] `worker/src/routes/memories.ts`: aggregate queries over
      `trip_photos`.
- [ ] Mount both; remove `'photos'` and `'memories'` from
      `STUBBED_PREFIXES`.
- [ ] Port tests.

## Source references

- Route: `server/src/routes/photos.ts` (47 lines)
- Route: `server/src/routes/memories/` (folder)
- Services: `server/src/services/photosService.ts`,
  `server/src/services/memoriesService.ts`

## Done-when

Upload a 2 MB JPEG → R2 object exists, list endpoint returns it.
