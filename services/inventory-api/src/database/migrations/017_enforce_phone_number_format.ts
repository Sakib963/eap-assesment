import type { Knex } from 'knex';

const PHONE_REGEX = '^01[3-9][0-9]{8}$';

export async function up(knex: Knex): Promise<void> {
  const hasUsersPhone = await knex.schema.hasColumn('users', 'phone');
  const hasOrdersPhone = await knex.schema.hasColumn('orders', 'customer_phone');

  if (hasUsersPhone) {
    await knex.raw(`
      UPDATE users
      SET phone = '01700000000'
      WHERE phone IS NULL
        OR BTRIM(phone) = ''
        OR phone !~ '${PHONE_REGEX}'
    `);

    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'users_phone_format_check'
        ) THEN
          ALTER TABLE users
          ADD CONSTRAINT users_phone_format_check
          CHECK (phone ~ '${PHONE_REGEX}') NOT VALID;
        END IF;
      END $$;
    `);

    await knex.raw(`ALTER TABLE users VALIDATE CONSTRAINT users_phone_format_check`);
  }

  if (hasOrdersPhone) {
    await knex.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'orders_customer_phone_format_check'
        ) THEN
          ALTER TABLE orders
          ADD CONSTRAINT orders_customer_phone_format_check
          CHECK (customer_phone ~ '${PHONE_REGEX}') NOT VALID;
        END IF;
      END $$;
    `);
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasUsersPhone = await knex.schema.hasColumn('users', 'phone');
  const hasOrdersPhone = await knex.schema.hasColumn('orders', 'customer_phone');

  if (hasUsersPhone) {
    await knex.raw(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_format_check`);
  }

  if (hasOrdersPhone) {
    await knex.raw(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_phone_format_check`);
  }
}
