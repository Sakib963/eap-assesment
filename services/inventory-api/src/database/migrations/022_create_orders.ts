import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('users.id').onDelete('RESTRICT');
    table.string('customer_name', 120).notNullable().defaultTo('Walk-in Customer');
    table.string('customer_phone', 30).notNullable().defaultTo('');
    table.text('customer_address').nullable();
    table.text('delivery_instruction').nullable();
    table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('total_amount', 12, 2).notNullable().defaultTo(0);
    table.string('status', 30).notNullable().defaultTo('pending');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_orders_user_created_at ON orders (user_id, created_at DESC)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders (status, created_at DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('orders');
}