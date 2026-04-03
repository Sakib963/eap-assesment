import type { Knex } from 'knex';

const USER_ROLE_ENUM = 'user_role';
const USER_STATUS_ENUM = 'user_status';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('name', 255).nullable();
    table.string('phone', 30).nullable();
    table
      .enu('role', ['manager', 'salesman'], {
        useNative: true,
        enumName: USER_ROLE_ENUM,
      })
      .notNullable()
      .defaultTo('salesman');
    table
      .enu('status', ['active', 'inactive'], {
        useNative: true,
        enumName: USER_STATUS_ENUM,
      })
      .notNullable()
      .defaultTo('active');
    table.string('created_by', 255).notNullable().defaultTo('system');
    table.string('updated_by', 255).notNullable().defaultTo('system');

    table.index('role');
    table.index('status');
    table.index('created_by');
  });

  await knex('users').update({ role: 'manager', status: 'active' });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropIndex([], 'users_role_index');
    table.dropIndex([], 'users_status_index');
    table.dropIndex([], 'users_created_by_index');

    table.dropColumn('name');
    table.dropColumn('phone');
    table.dropColumn('role');
    table.dropColumn('status');
    table.dropColumn('created_by');
    table.dropColumn('updated_by');
  });

  await knex.raw(`DROP TYPE IF EXISTS ${USER_ROLE_ENUM}`);
  await knex.raw(`DROP TYPE IF EXISTS ${USER_STATUS_ENUM}`);
}
