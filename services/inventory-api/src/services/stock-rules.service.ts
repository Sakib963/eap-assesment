import type { Knex } from 'knex';
import { logActivity } from './activity-log.service.js';

export interface ProductStockSnapshot {
  id: string;
  name?: string;
  current_stock: number;
  min_stock_threshold: number;
  is_active: boolean;
}

const determinePriority = (stock: number, threshold: number): 'low' | 'medium' | 'high' => {
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

export const syncRestockQueueForProduct = async (
  trx: Knex.Transaction,
  product: ProductStockSnapshot
): Promise<void> => {
  const pendingQuery = trx('restock_queue')
    .where({ product_id: product.id, status: 'pending' })
    .orderBy('created_at', 'desc');

  // Inactive products are not orderable and should not remain in active restock queue.
  if (!product.is_active) {
    await pendingQuery.clone().del();
    return;
  }

  const needsRestock = product.current_stock <= product.min_stock_threshold;
  if (!needsRestock) {
    await pendingQuery.clone().del();
    return;
  }

  const quantityNeeded = Math.max(product.min_stock_threshold - product.current_stock, 0);
  const priority = determinePriority(product.current_stock, product.min_stock_threshold);

  const existing = await pendingQuery.clone().first<{ id: string }>('id');

  if (existing) {
    await trx('restock_queue')
      .where({ id: existing.id })
      .update({
        quantity_needed: quantityNeeded,
        priority,
      });
    return;
  }

  await trx('restock_queue').insert({
    product_id: product.id,
    quantity_needed: quantityNeeded,
    priority,
    status: 'pending',
  });

  void logActivity({
    user_id: null,
    action: product.name
      ? `Product "${product.name}" auto-added to restock queue`
      : 'Product auto-added to restock queue',
    entity_type: 'stock',
    entity_id: product.id,
    details: {
      quantity_needed: quantityNeeded,
      priority,
      trigger: 'stock_threshold',
    },
  });
};

export const syncRestockQueueForProducts = async (
  trx: Knex.Transaction,
  products: ProductStockSnapshot[]
): Promise<void> => {
  for (const product of products) {
    await syncRestockQueueForProduct(trx, product);
  }
};
