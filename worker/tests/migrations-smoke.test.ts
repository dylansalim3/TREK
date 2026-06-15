import { describe, it, expect } from 'vitest';
import { env, applyD1Migrations } from 'cloudflare:test';
import rawSql from '../migrations/0001_initial_schema.sql?raw';
import { splitSql } from './helpers/sql';

describe('DB migrations snapshot', () => {
  it('produces the expected sqlite_master shape', async () => {
    await applyD1Migrations(env.DB, [
      {
        name: '0001_initial_schema',
        queries: splitSql(rawSql),
      },
    ]);

    const rows = await env.DB.prepare(
      `SELECT type, name, tbl_name, sql
       FROM sqlite_master
       WHERE name NOT LIKE '_cf_%'
         AND name NOT LIKE 'sqlite_%'
       ORDER BY type, name`
    ).all();

    const results = rows.results ?? [];
    expect(results.length).toBeGreaterThan(30);

    const snapshot = results.map((r: any) =>
      `${r.type}:${r.name}` + (r.type === 'index' ? ` ON ${r.tbl_name}` : '')
    ).join('\n');

    expect(snapshot).toMatchInlineSnapshot(`
      "index:idx_assignment_participants_assignment ON assignment_participants
      index:idx_audit_log_created ON audit_log
      index:idx_budget_items_trip_id ON budget_items
      index:idx_collab_messages_trip ON collab_messages
      index:idx_collab_notes_trip ON collab_notes
      index:idx_collab_polls_trip ON collab_polls
      index:idx_day_accommodations_trip_id ON day_accommodations
      index:idx_day_assignments_day_id ON day_assignments
      index:idx_day_assignments_place_id ON day_assignments
      index:idx_day_notes_day_id ON day_notes
      index:idx_days_trip_id ON days
      index:idx_ncp_user ON notification_channel_preferences
      index:idx_notifications_recipient ON notifications
      index:idx_notifications_recipient_created ON notifications
      index:idx_packing_items_trip_id ON packing_items
      index:idx_photos_trip_id ON photos
      index:idx_place_tags_place_id ON place_tags
      index:idx_place_tags_tag_id ON place_tags
      index:idx_places_category_id ON places
      index:idx_places_trip_id ON places
      index:idx_prt_hash ON password_reset_tokens
      index:idx_prt_user ON password_reset_tokens
      index:idx_reservations_trip_id ON reservations
      index:idx_trip_files_trip_id ON trip_files
      index:idx_trip_members_trip_id ON trip_members
      index:idx_trip_members_user_id ON trip_members
      index:idx_users_email ON users
      table:addons
      table:app_settings
      table:assignment_participants
      table:audit_log
      table:budget_items
      table:categories
      table:collab_messages
      table:collab_notes
      table:collab_poll_votes
      table:collab_polls
      table:d1_migrations
      table:day_accommodations
      table:day_assignments
      table:day_notes
      table:days
      table:migrations
      table:notification_channel_preferences
      table:notifications
      table:packing_items
      table:password_reset_tokens
      table:photo_provider_fields
      table:photo_providers
      table:photos
      table:place_tags
      table:places
      table:reservations
      table:settings
      table:tags
      table:trip_files
      table:trip_members
      table:trips
      table:users
      table:vacay_company_holidays
      table:vacay_entries
      table:vacay_holiday_calendars
      table:vacay_plan_members
      table:vacay_plans
      table:vacay_user_colors
      table:vacay_user_years
      table:vacay_years"
    `);
  });
});
