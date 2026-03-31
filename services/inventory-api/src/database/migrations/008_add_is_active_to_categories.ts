import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('categories', (table) => {
    table.boolean('is_active').notNullable().defaultTo(true);
    table.index('is_active');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('categories', (table) => {
    table.dropIndex(['is_active']);
    table.dropColumn('is_active');
  });
}
