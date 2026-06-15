import { env } from 'cloudflare:test';
import bcrypt from 'bcryptjs';

let _userSeq = 0;
let _tripSeq = 0;
let _categorySeq = 0;
let _tagSeq = 0;

export interface TestUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  password_hash: string;
}

export async function createUser(
  overrides: Partial<{ username: string; email: string; password: string; role: 'admin' | 'user' }> = {}
): Promise<{ user: TestUser; password: string }> {
  _userSeq++;
  const password = overrides.password ?? `TestPass${_userSeq}!`;
  const email = overrides.email ?? `user${_userSeq}@test.example.com`;
  const username = overrides.username ?? `testuser${_userSeq}`;
  const role = overrides.role ?? 'user';
  const hash = await bcrypt.hash(password, 4);

  const result = await env.DB.prepare(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?) RETURNING *'
  ).bind(username, email, hash, role).first<TestUser>();

  return { user: result!, password };
}

export async function createAdmin(
  overrides: Partial<{ username: string; email: string; password: string }> = {}
): Promise<{ user: TestUser; password: string }> {
  return createUser({ ...overrides, role: 'admin' });
}

export interface TestTrip {
  id: number;
  user_id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
}

export async function createTrip(
  userId: number,
  overrides: Partial<{ title: string; start_date: string; end_date: string; description: string }> = {}
): Promise<TestTrip> {
  _tripSeq++;
  const title = overrides.title ?? `Test Trip ${_tripSeq}`;
  const result = await env.DB.prepare(
    'INSERT INTO trips (user_id, title, description, start_date, end_date) VALUES (?, ?, ?, ?, ?) RETURNING *'
  ).bind(userId, title, overrides.description ?? null, overrides.start_date ?? null, overrides.end_date ?? null)
    .first<TestTrip>();

  if (overrides.start_date && overrides.end_date) {
    const start = new Date(overrides.start_date);
    const end = new Date(overrides.end_date);
    let dayNumber = 1;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      await env.DB.prepare(
        'INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, ?)'
      ).bind(result!.id, dayNumber++, dateStr).run();
    }
  }

  return result!;
}

export async function addTripMember(tripId: number, userId: number): Promise<void> {
  await env.DB.prepare(
    'INSERT OR IGNORE INTO trip_members (trip_id, user_id) VALUES (?, ?)'
  ).bind(tripId, userId).run();
}

export interface TestCategory {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export async function createCategory(
  overrides: Partial<{ name: string; color: string; icon: string; user_id: number }> = {}
): Promise<TestCategory> {
  _categorySeq++;
  const name = overrides.name ?? `Test Category ${_categorySeq}`;
  const color = overrides.color ?? '#6366f1';
  const icon = overrides.icon ?? '📍';
  const result = await env.DB.prepare(
    'INSERT INTO categories (name, color, icon, user_id) VALUES (?, ?, ?, ?) RETURNING *'
  ).bind(name, color, icon, overrides.user_id ?? null).first<TestCategory>();
  return result!;
}

export interface TestTag {
  id: number;
  name: string;
  color: string;
  user_id: number;
}

export async function createTag(
  userId: number,
  overrides: Partial<{ name: string; color: string }> = {}
): Promise<TestTag> {
  _tagSeq++;
  const name = overrides.name ?? `test-tag-${_tagSeq}`;
  const color = overrides.color ?? '#ef4444';
  const result = await env.DB.prepare(
    'INSERT INTO tags (name, color, user_id) VALUES (?, ?, ?) RETURNING *'
  ).bind(name, color, userId).first<TestTag>();
  return result!;
}

const RESET_TABLES = [
  'assignment_participants',
  'day_assignments',
  'place_tags',
  'places',
  'budget_item_members',
  'budget_items',
  'trip_photos',
  'trip_files',
  'reservations',
  'day_accommodations',
  'day_notes',
  'days',
  'share_tokens',
  'trip_members',
  'trips',
  'collab_message_reactions',
  'collab_messages',
  'collab_poll_votes',
  'collab_polls',
  'collab_notes',
  'file_links',
  'packing_category_assignees',
  'packing_bag_members',
  'packing_bags',
  'packing_items',
  'packing_template_items',
  'packing_template_categories',
  'packing_templates',
  'tags',
  'settings',
  'mcp_tokens',
  'invite_tokens',
  'notifications',
  'audit_log',
  'user_notice_dismissals',
  'visited_regions',
  'visited_countries',
  'bucket_list',
  'password_reset_tokens',
  'vacay_entries',
  'vacay_company_holidays',
  'vacay_holiday_calendars',
  'vacay_plan_members',
  'vacay_user_colors',
  'vacay_user_years',
  'vacay_years',
  'vacay_plans',
  'journey_share_tokens',
  'journey_photos',
  'journey_entries',
  'journey_contributors',
  'journey_trips',
  'journeys',
  'users',
];

export async function resetTestDb(): Promise<void> {
  await env.DB.prepare('PRAGMA foreign_keys = OFF').run();
  const { results } = await env.DB.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'sqlite_%'`
  ).all<{ name: string }>();
  const existingTables = new Set((results ?? []).map((r) => r.name));
  for (const table of RESET_TABLES) {
    if (existingTables.has(table)) {
      await env.DB.prepare(`DELETE FROM "${table}"`).run();
    }
  }
  await env.DB.prepare('PRAGMA foreign_keys = ON').run();
}
