import db from '../config/database.js';

export type RestockPriority = 'low' | 'medium' | 'high';
export type RestockStatus = 'pending' | 'completed';

interface RestockQueueRow {
  id: string;
  product_id: string;
  quantity_needed: number;
  priority: RestockPriority;
  status: RestockStatus;
  created_at: string;
  completed_at: string | null;
  product_name: string;
  current_stock: number;
  min_stock_threshold: number;
}

export interface RestockQueueItemView {
  id: string;
  product_id: string;
  product_name: string;
  quantity_needed: number;
  priority: RestockPriority;
  status: RestockStatus;
  current_stock: number;
  min_stock_threshold: number;
  created_at: string;
  completed_at: string | null;
}

export interface RestockListFilters {
  page: number;
  pageSize: number;
  status?: RestockStatus;
  priority?: RestockPriority;
}

const mapQueueItem = (row: RestockQueueRow): RestockQueueItemView => ({
  id: row.id,
  product_id: row.product_id,
  product_name: row.product_name,
  quantity_needed: Number(row.quantity_needed),
  priority: row.priority,
  status: row.status,
  current_stock: Number(row.current_stock),
  min_stock_threshold: Number(row.min_stock_threshold),
  created_at: row.created_at,
  completed_at: row.completed_at,
});

export const listRestockQueue = async (
  filters: RestockListFilters
): Promise<{ items: RestockQueueItemView[]; total: number; page: number; pageSize: number }> => {
  const { page, pageSize, status, priority } = filters;
  const offset = (page - 1) * pageSize;

  const baseQuery = db('restock_queue as rq')
    .join('products as p', 'p.id', 'rq.product_id')
    .modify((builder) => {
      if (status) {
        builder.where('rq.status', status);
      }
      if (priority) {
        builder.where('rq.priority', priority);
      }
    });

  const countResult = await baseQuery.clone().count<{ count: string }>('rq.id as count').first();

  const rows = (await baseQuery
    .clone()
    .select(
      'rq.id',
      'rq.product_id',
      'rq.quantity_needed',
      'rq.priority',
      'rq.status',
      'rq.created_at',
      'rq.completed_at',
      'p.name as product_name',
      'p.current_stock',
      'p.min_stock_threshold'
    )
    .orderBy('p.current_stock', 'asc')
    .orderBy('rq.created_at', 'asc')
    .offset(offset)
    .limit(pageSize)) as RestockQueueRow[];

  return {
    items: rows.map(mapQueueItem),
    total: Number(countResult?.count ?? 0),
    page,
    pageSize,
  };
};

export const markRestockCompleted = async (id: string): Promise<RestockQueueItemView | null> => {
  const updatedRows = await db('restock_queue')
    .where({ id })
    .andWhere({ status: 'pending' })
    .update({
      status: 'completed',
      completed_at: db.fn.now(),
    });

  if (!updatedRows) {
    return null;
  }

  const row = (await db('restock_queue as rq')
    .join('products as p', 'p.id', 'rq.product_id')
    .select(
      'rq.id',
      'rq.product_id',
      'rq.quantity_needed',
      'rq.priority',
      'rq.status',
      'rq.created_at',
      'rq.completed_at',
      'p.name as product_name',
      'p.current_stock',
      'p.min_stock_threshold'
    )
    .where('rq.id', id)
    .first()) as RestockQueueRow | undefined;

  return row ? mapQueueItem(row) : null;
};
