/**
 * Database utilities and query helpers
 * Provides type-safe access to database tables
 */

import db from '../config/database.js';

export const Tables = {
  users: () => db('users'),
  categories: () => db('categories'),
  products: () => db('products'),
  orders: () => db('orders'),
  order_items: () => db('order_items'),
  restock_queue: () => db('restock_queue'),
  activity_logs: () => db('activity_logs'),
};

/**
 * Execute query and handle errors consistently
 */
export async function executeQuery<T>(
  queryFn: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await queryFn();
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.error('Database query error:', message);
    return { success: false, error: message };
  }
}

export default db;
