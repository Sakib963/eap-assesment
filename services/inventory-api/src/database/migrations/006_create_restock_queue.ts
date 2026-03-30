import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('restock_queue', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('product_id').notNullable().references('products.id').onDelete('CASCADE');
    table.integer('quantity_needed').notNullable();
    table.enum('priority', ['low', 'medium', 'high']).notNullable().defaultTo('medium');
    table.enum('status', ['pending', 'completed']).notNullable().defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
    
    // Indexes for dashboard and priority queries
    table.index('product_id');
    table.index('status');
    table.index('priority');
    table.index(['status', 'priority']);
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('restock_queue');
}
