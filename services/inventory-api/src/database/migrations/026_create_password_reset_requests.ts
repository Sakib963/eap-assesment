import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('password_reset_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE');
    table.string('email', 255).notNullable();
    table.string('otp_code', 10).notNullable();
    table.integer('attempt_count').notNullable().defaultTo(0);
    table.boolean('verified').notNullable().defaultTo(false);
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_requests (user_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_requests (email)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at ON password_reset_requests (expires_at)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('password_reset_requests');
}