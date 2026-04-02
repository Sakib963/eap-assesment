import db from '../config/database.js';
import { logActivity } from './activity-log.service.js';

export interface CategoryRecord {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryAssignmentStatus {
  exists: boolean;
  isActive: boolean;
}

interface CategoryFilters {
  search?: string;
  status?: 'active' | 'inactive';
  page: number;
  pageSize: number;
}

let hasIsActiveColumnCache: boolean | null = null;

const hasIsActiveColumn = async (): Promise<boolean> => {
  if (hasIsActiveColumnCache !== null) {
    return hasIsActiveColumnCache;
  }

  hasIsActiveColumnCache = await db.schema.hasColumn('categories', 'is_active');
  return hasIsActiveColumnCache;
};

const normalizeCategoryRecord = (record: Partial<CategoryRecord>): CategoryRecord => {
  return {
    id: record.id as string,
    name: record.name as string,
    description: (record.description ?? null) as string | null,
    is_active: typeof record.is_active === 'boolean' ? record.is_active : true,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
};

export const listCategories = async (filters: CategoryFilters): Promise<{ items: CategoryRecord[]; total: number; page: number; pageSize: number }> => {
  const { search = '', status, page, pageSize } = filters;
  const offset = (page - 1) * pageSize;
  const withStatusColumn = await hasIsActiveColumn();

  const query = db<CategoryRecord>('categories').modify((builder) => {
    if (search) {
      builder.whereILike('name', `%${search}%`);
    }

    if (status && withStatusColumn) {
      builder.where('is_active', status === 'active');
    }
  });

  const countResult = await query.clone().count<{ count: string }>('id as count').first();
  const items = await query
    .clone()
    .modify((builder) => {
      if (withStatusColumn) {
        builder.select('id', 'name', 'description', 'is_active', 'created_at', 'updated_at');
      } else {
        builder.select('id', 'name', 'description', 'created_at', 'updated_at');
      }
    })
    .orderByRaw('LOWER(name) ASC')
    .offset(offset)
    .limit(pageSize);

  return {
    items: items.map((item: Partial<CategoryRecord>) => normalizeCategoryRecord(item)),
    total: Number(countResult?.count ?? 0),
    page,
    pageSize,
  };
};

export const createCategory = async (
  payload: { name: string; description?: string | null; is_active?: boolean },
  userId?: string | null
): Promise<CategoryRecord> => {
  const withStatusColumn = await hasIsActiveColumn();

  const insertPayload: Record<string, unknown> = {
    name: payload.name,
    description: payload.description ?? null,
  };

  if (withStatusColumn) {
    insertPayload['is_active'] = payload.is_active ?? true;
  }

  const inserted = await db<CategoryRecord>('categories')
    .insert(insertPayload)
    .returning(
      withStatusColumn
        ? ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        : ['id', 'name', 'description', 'created_at', 'updated_at']
    );

  const result = normalizeCategoryRecord(inserted[0] as Partial<CategoryRecord>);

  void logActivity({
    user_id: userId ?? null,
    action: `Category "${result.name}" created`,
    entity_type: 'category',
    entity_id: result.id,
  });

  return result;
};

export const updateCategory = async (
  id: string,
  payload: { name?: string; description?: string | null; is_active?: boolean },
  userId?: string | null
): Promise<CategoryRecord | null> => {
  const withStatusColumn = await hasIsActiveColumn();

  const updatePayload: Record<string, unknown> = {
    updated_at: db.fn.now(),
  };

  if (payload.name !== undefined) {
    updatePayload['name'] = payload.name;
  }

  if (payload.description !== undefined) {
    updatePayload['description'] = payload.description;
  }

  if (withStatusColumn && payload.is_active !== undefined) {
    updatePayload['is_active'] = payload.is_active;
  }

  const updated = await db<CategoryRecord>('categories')
    .where({ id })
    .update(
      updatePayload,
      withStatusColumn
        ? ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        : ['id', 'name', 'description', 'created_at', 'updated_at']
    );

  const row = updated[0] as Partial<CategoryRecord> | undefined;
  if (!row) {
    return null;
  }

  const result = normalizeCategoryRecord(row);

  void logActivity({
    user_id: userId ?? null,
    action: `Category "${result.name}" updated`,
    entity_type: 'category',
    entity_id: result.id,
  });

  return result;
};

export const deleteCategory = async (id: string, userId?: string | null): Promise<boolean> => {
  const existing = await db<CategoryRecord>('categories').where({ id }).first();
  const deletedRows = await db<CategoryRecord>('categories').where({ id }).del();

  if (deletedRows > 0 && existing) {
    void logActivity({
      user_id: userId ?? null,
      action: `Category "${existing.name}" deleted`,
      entity_type: 'category',
      entity_id: id,
    });
  }

  return deletedRows > 0;
};

export const categoryHasProducts = async (id: string): Promise<boolean> => {
  const result = await db('products').where({ category_id: id }).count<{ count: string }>('id as count').first();
  return Number(result?.count ?? 0) > 0;
};

export const findCategoryByNameInsensitive = async (name: string): Promise<Pick<CategoryRecord, 'id' | 'name'> | null> => {
  const row = await db<CategoryRecord>('categories')
    .select('id', 'name')
    .whereRaw('LOWER(name) = LOWER(?)', [name])
    .first();

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
  };
};

export const getCategoryAssignmentStatus = async (id: string): Promise<CategoryAssignmentStatus> => {
  const withStatusColumn = await hasIsActiveColumn();

  if (!withStatusColumn) {
    const row = await db<CategoryRecord>('categories').select('id').where({ id }).first();
    if (!row) {
      return { exists: false, isActive: false };
    }

    return { exists: true, isActive: true };
  }

  const row = await db<CategoryRecord>('categories').select('id', 'is_active').where({ id }).first();
  if (!row) {
    return { exists: false, isActive: false };
  }

  return {
    exists: true,
    isActive: row.is_active !== false,
  };
};
