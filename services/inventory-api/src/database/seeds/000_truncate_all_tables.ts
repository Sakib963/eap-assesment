import type { Knex } from 'knex';

const TABLES = [
  'password_reset_requests',
  'activity_logs',
  'restock_queue',
  'order_items',
  'orders',
  'products',
  'categories',
  'users',
];

export async function seed(knex: Knex): Promise<void> {
  await knex.raw(`TRUNCATE TABLE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);
}
