import type { Knex } from 'knex';
import { priorityFor, toDate, toId } from '../seed-data/index.js';

export async function seed(knex: Knex): Promise<void> {
  const manager = await knex('users').where({ email: 'demo@inventory.local' }).first('id');
  const managerId = manager ? toId(manager) : null;
  const products = await knex('products')
    .select('id', 'name', 'current_stock', 'min_stock_threshold', 'is_active')
    .where('is_active', true)
    .andWhereRaw('current_stock <= min_stock_threshold')
    .orderBy('current_stock', 'asc');

  const queueRows = products.map((product, index) => {
    const currentStock = Number((product as { current_stock: number }).current_stock);
    const threshold = Number((product as { min_stock_threshold: number }).min_stock_threshold);
    const quantityNeeded = Math.max(threshold - currentStock, 0);
    return {
      product_id: toId(product),
      quantity_needed: quantityNeeded,
      priority: priorityFor(currentStock, threshold),
      status: 'pending',
      created_at: toDate(index % 10, 14 + (index % 4), (index * 5) % 60),
      completed_at: null,
    };
  });

  await knex('restock_queue').insert(queueRows);

  const logs = products.map((product, index) => {
    const currentStock = Number((product as { current_stock: number }).current_stock);
    const threshold = Number((product as { min_stock_threshold: number }).min_stock_threshold);
    return {
      user_id: managerId,
      action: `Product "${String((product as { name: string }).name)}" auto-added to restock queue`,
      entity_type: 'stock',
      entity_id: toId(product),
      details: {
        quantity_needed: Math.max(threshold - currentStock, 0),
        priority: priorityFor(currentStock, threshold),
        trigger: 'seed',
      },
      created_at: toDate(index % 10, 15 + (index % 4), (index * 5) % 60),
    };
  });

  await knex('activity_logs').insert(logs);
}
