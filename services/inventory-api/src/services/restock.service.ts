import db from '../config/database.js';
import { logActivity } from './activity-log.service.js';

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

const determinePriority = (stock: number, threshold: number): RestockPriority => {
  if (stock <= 0) {
    return 'high';
  }

  if (threshold <= 0) {
    return 'low';
  }

  if (stock <= Math.floor(threshold / 2)) {
    return 'medium';
  }

  return 'low';
};

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

export const restockProduct = async (
  id: string,
  quantityAdded: number,
  userId?: string | null
): Promise<RestockQueueItemView | null> => {
  const result = await db.transaction(async (trx) => {
    const existing = (await trx('restock_queue as rq')
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

    if (!existing) return null;

    const nextStock = Number(existing.current_stock) + quantityAdded;
    const minThreshold = Number(existing.min_stock_threshold);
    const nextStatus: RestockStatus = nextStock >= minThreshold ? 'completed' : 'pending';
    const nextQuantityNeeded = Math.max(minThreshold - nextStock, 0);
    const nextPriority = determinePriority(nextStock, minThreshold);
    const completedAt = new Date().toISOString();

    await trx('products')
      .where({ id: existing.product_id })
      .update({
        current_stock: trx.raw('current_stock + ?', [quantityAdded]),
        updated_at: trx.fn.now(),
      });

    if (nextStatus === 'completed') {
      await trx('restock_queue').where({ id }).del();

      return {
        id: existing.id,
        product_id: existing.product_id,
        product_name: existing.product_name,
        quantity_needed: 0,
        priority: nextPriority,
        status: 'completed' as const,
        current_stock: nextStock,
        min_stock_threshold: minThreshold,
        created_at: existing.created_at,
        completed_at: completedAt,
      };
    }

    await trx('restock_queue')
      .where({ id })
      .update({
        status: 'pending',
        quantity_needed: nextQuantityNeeded,
        priority: nextPriority,
        completed_at: null,
      });

    const finalRow = (await trx('restock_queue as rq')
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

    return finalRow ? mapQueueItem(finalRow) : null;
  });

  if (result) {
    void logActivity({
      user_id: userId ?? null,
      action: `Product "${result.product_name}" restocked with ${quantityAdded} units`,
      entity_type: 'stock',
      entity_id: result.product_id,
      details: { quantity_added: quantityAdded, product_name: result.product_name },
    });
  }

  return result;
};

export const markRestockCompleted = async (id: string, userId?: string | null): Promise<RestockQueueItemView | null> => {
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

  const result = row ? mapQueueItem(row) : null;

  if (result) {
    void logActivity({
      user_id: userId ?? null,
      action: `Restock completed for product "${result.product_name}"`,
      entity_type: 'stock',
      entity_id: id,
      details: { product_id: result.product_id, product_name: result.product_name },
    });
  }

  return result;
};
