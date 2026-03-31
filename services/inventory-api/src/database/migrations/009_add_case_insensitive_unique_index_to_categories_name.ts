import type { Knex } from 'knex';

const INDEX_NAME = 'categories_name_lower_unique_idx';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`CREATE UNIQUE INDEX IF NOT EXISTS ${INDEX_NAME} ON categories (LOWER(name))`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${INDEX_NAME}`);
}
