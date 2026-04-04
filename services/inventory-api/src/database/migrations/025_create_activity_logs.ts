import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('activity_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').nullable().references('users.id').onDelete('SET NULL');
    table.text('action').notNullable();
    table.string('entity_type', 50).notNullable();
    table.uuid('entity_id').nullable();
    table.jsonb('details').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs (created_at DESC)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs (user_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs (entity_type)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('activity_logs');
}