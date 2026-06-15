// File / photo / avatar uploads to R2.
//
// Replaces server/src/routes/files.ts and photos.ts which used multer + filesystem.
// In Workers we accept multipart/form-data and stream the body directly into R2.

import { Hono } from 'hono';
import type { AppVariables, Env } from '../types';
import { requireAuth } from '../middleware/auth';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use('*', requireAuth);

// POST /api/files/upload  (multipart form, field "file", optional fields: trip_id, place_id, description)
app.post('/upload', async (c) => {
  const user = c.get('user')!;
  const form = await c.req.formData().catch(() => null);
  if (!form) return c.json({ error: 'Expected multipart form' }, 400);

  const file = form.get('file');
  if (!(file instanceof File)) return c.json({ error: 'Missing file' }, 400);

  const tripIdRaw = form.get('trip_id');
  const tripId = tripIdRaw ? Number(tripIdRaw) : null;
  const placeId = form.get('place_id') ? Number(form.get('place_id')) : null;
  const description = form.get('description')?.toString() ?? null;

  // Authorize: user must own or be a member of the target trip (if provided).
  if (tripId) {
    const ok = await c.env.DB.prepare(
      `SELECT 1 FROM trips t
       WHERE t.id = ? AND (t.user_id = ? OR EXISTS(
         SELECT 1 FROM trip_members m WHERE m.trip_id = t.id AND m.user_id = ?
       ))
       LIMIT 1`,
    )
      .bind(tripId, user.sub, user.sub)
      .first();
    if (!ok) return c.json({ error: 'Forbidden' }, 403);
  }

  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
  const key = `files/${tripId ?? 'misc'}/${crypto.randomUUID()}${ext}`;

  await c.env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
    customMetadata: {
      original_name: file.name,
      uploaded_by: String(user.sub),
    },
  });

  if (tripId) {
    await c.env.DB.prepare(
      `INSERT INTO trip_files (trip_id, place_id, filename, original_name, file_size, mime_type, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(tripId, placeId, key, file.name, file.size, file.type || null, description)
      .run();
  }

  return c.json({ key, original_name: file.name, size: file.size, mime_type: file.type }, 201);
});

// GET /api/files/:key — streams a private object back to the client.
// The colon-prefixed param captures the rest of the path (R2 keys contain slashes).
app.get('/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const obj = await c.env.UPLOADS.get(key);
  if (!obj) return c.json({ error: 'Not found' }, 404);

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  return new Response(obj.body, { headers });
});

export default app;
