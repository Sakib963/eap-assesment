import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('order_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('order_id').notNullable().references('orders.id').onDelete('CASCADE');
    table.uuid('product_id').notNullable().references('products.id').onDelete('RESTRICT');
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 12, 2).notNullable();
    table.decimal('line_total', 12, 2).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(['order_id', 'product_id']);
  });

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('order_items');
}