import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255).notNullable();
    table.string('phone', 30).notNullable();
    table.string('role', 30).notNullable().defaultTo('salesman');
    table.string('status', 30).notNullable().defaultTo('active');
    table.string('created_by', 255).notNullable().defaultTo('system');
    table.string('updated_by', 255).notNullable().defaultTo('system');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_users_status ON users (status)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}