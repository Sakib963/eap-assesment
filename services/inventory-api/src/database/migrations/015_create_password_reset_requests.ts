import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('password_reset_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE');
    table.string('email', 255).notNullable();
    table.string('otp_code', 10).notNullable();
    table.integer('attempt_count').notNullable().defaultTo(0);
    table.boolean('verified').notNullable().defaultTo(false);
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('user_id');
    table.index('email');
    table.index('expires_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('password_reset_requests');
}
