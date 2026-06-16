# F6 — Backup / restore with fflate + R2

**Status:** ⏳ Not started
**Owner:** unassigned
**Migration block:** —
**Blocked by:** none
**Blocks:** R-admin partially (backup tab in admin UI)

## Goal

Replace `archiver` / `unzipper` (native streams) with `fflate` (pure JS,
Workers-compatible). Backup blobs land in R2 under `backups/<timestamp>.zip`;
restore reads the blob and replays into D1.

## Scope

- [ ] `worker/src/services/backup.ts`:
  - `createBackup(env): Promise<{ key: string; bytes: number }>` — exports
    every D1 table to JSON, zips with `fflate`, uploads to R2.
  - `restoreBackup(env, key): Promise<void>` — reads R2 object, unzips,
    `INSERT OR REPLACE` per table inside `env.DB.batch([...])`.
  - `listBackups(env)` and `deleteBackup(env, key)`.
- [ ] `worker/src/routes/backup.ts` mirroring the Express endpoints
      (covered by plan R-admin; this plan just provides the service).
- [ ] Tests: create backup → assert R2 object exists, list returns it,
      restore replays into an empty DB and tables match.

## Source references

- Express: `server/src/services/backup.ts`, `server/src/routes/backup.ts`

## Done-when

Round-trip on the dev Worker: create backup, delete a trip, restore,
asserted trip is back.
