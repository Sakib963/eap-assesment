import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('order_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('order_id').notNullable().references('orders.id').onDelete('CASCADE');
    table.uuid('product_id').notNullable().references('products.id').onDelete('RESTRICT');
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Composite unique: only one item per product per order
    table.unique(['order_id', 'product_id']);
    
    // Indexes for queries
    table.index('order_id');
    table.index('product_id');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('order_items');
}
