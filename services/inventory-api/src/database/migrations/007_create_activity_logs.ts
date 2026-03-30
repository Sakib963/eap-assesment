import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('activity_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE');
    table.string('action', 50).notNullable(); // 'create_product', 'order_placed', 'stock_updated', etc.
    table.enum('entity_type', ['product', 'order', 'stock', 'category']).notNullable();
    table.uuid('entity_id').notNullable();
    table.jsonb('details').nullable(); // Store additional context
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes for audit queries
    table.index('user_id');
    table.index('action');
    table.index('entity_type');
    table.index('entity_id');
    table.index('created_at');
    table.index(['user_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('activity_logs');
}
