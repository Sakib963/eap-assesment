import db from '../config/database.js';

export interface ActivityLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface ActivityLogRow {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  user_email: string | null;
}

export interface LogActivityInput {
  user_id?: string | null;
  action: string;
  entity_type: 'product' | 'order' | 'stock' | 'category';
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
}

export const logActivity = async (entry: LogActivityInput): Promise<void> => {
  try {
    await db('activity_logs').insert({
      user_id: entry.user_id ?? null,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      details: entry.details ? JSON.stringify(entry.details) : null,
    });
  } catch {
    // swallow - logging failures must never break the main request flow
  }
};

export const listActivityLogs = async (limit = 10): Promise<ActivityLogEntry[]> => {
  const rows = (await db('activity_logs as al')
    .leftJoin('users as u', 'u.id', 'al.user_id')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .select(
      'al.id',
      'al.user_id',
      'al.action',
      'al.entity_type',
      'al.entity_id',
      'al.details',
      'al.created_at',
      'u.email as user_email'
    )) as ActivityLogRow[];

  return rows.map((row) => ({
    id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    action: row.action.includes(' by ')
      ? String(row.action)
      : `${String(row.action)} by ${row.user_email ? String(row.user_email) : 'system'}`,
    entity_type: String(row.entity_type),
    entity_id: row.entity_id ? String(row.entity_id) : null,
    details: row.details ?? null,
    created_at: String(row.created_at),
  }));
};
