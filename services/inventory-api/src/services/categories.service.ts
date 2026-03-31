import db from '../config/database.js';

export interface CategoryRecord {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface CategoryFilters {
  search?: string;
  page: number;
  pageSize: number;
}

export const listCategories = async (filters: CategoryFilters): Promise<{ items: CategoryRecord[]; total: number; page: number; pageSize: number }> => {
  const { search = '', page, pageSize } = filters;
  const offset = (page - 1) * pageSize;

  const query = db<CategoryRecord>('categories').modify((builder) => {
    if (search) {
      builder.whereILike('name', `%${search}%`);
    }
  });

  const countResult = await query.clone().count<{ count: string }>('id as count').first();
  const items = await query.clone().orderBy('name', 'asc').offset(offset).limit(pageSize);

  return {
    items,
    total: Number(countResult?.count ?? 0),
    page,
    pageSize,
  };
};

export const createCategory = async (payload: { name: string; description?: string | null }): Promise<CategoryRecord> => {
  const inserted = await db<CategoryRecord>('categories')
    .insert({
      name: payload.name,
      description: payload.description ?? null,
    })
    .returning(['id', 'name', 'description', 'created_at', 'updated_at']);

  return inserted[0] as CategoryRecord;
};

export const updateCategory = async (
  id: string,
  payload: { name?: string; description?: string | null }
): Promise<CategoryRecord | null> => {
  const updated = await db<CategoryRecord>('categories')
    .where({ id })
    .update(
      {
        ...payload,
        updated_at: db.fn.now(),
      },
      ['id', 'name', 'description', 'created_at', 'updated_at']
    );

  return (updated[0] as CategoryRecord | undefined) ?? null;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  const deletedRows = await db<CategoryRecord>('categories').where({ id }).del();
  return deletedRows > 0;
};
