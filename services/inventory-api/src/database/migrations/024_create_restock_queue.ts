import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('restock_queue', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('product_id').notNullable().references('products.id').onDelete('CASCADE');
    table.integer('quantity_needed').notNullable();
    table.string('priority', 20).notNullable();
    table.string('status', 20).notNullable().defaultTo('pending');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('completed_at', { useTz: true }).nullable();
  });

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_restock_queue_product_id ON restock_queue (product_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_restock_queue_status ON restock_queue (status)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_restock_queue_priority ON restock_queue (priority)');
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS restock_queue_pending_product_unique
    ON restock_queue (product_id)
    WHERE status = 'pending'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('restock_queue');
}