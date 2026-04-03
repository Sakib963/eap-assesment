import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('manager', 'salesman');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive');
      END IF;
    END$$;
  `);

  await knex.raw(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)`);
  await knex.raw(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30)`);
  await knex.raw(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'salesman'`);
  await knex.raw(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active'`);
  await knex.raw(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT 'system'`);
  await knex.raw(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255) DEFAULT 'system'`);

  await knex.raw(`
    UPDATE users
    SET
      name = COALESCE(NULLIF(BTRIM(name), ''), SPLIT_PART(email, '@', 1)),
      phone = COALESCE(NULLIF(BTRIM(phone), ''), '01700000000'),
      role = COALESCE(role, 'salesman'::user_role),
      status = COALESCE(status, 'active'::user_status),
      created_by = COALESCE(NULLIF(BTRIM(created_by), ''), 'system'),
      updated_by = COALESCE(NULLIF(BTRIM(updated_by), ''), 'system')
  `);

  await knex.raw(`ALTER TABLE users ALTER COLUMN name SET NOT NULL`);
  await knex.raw(`ALTER TABLE users ALTER COLUMN phone SET NOT NULL`);
  await knex.raw(`ALTER TABLE users ALTER COLUMN role SET NOT NULL`);
  await knex.raw(`ALTER TABLE users ALTER COLUMN status SET NOT NULL`);
  await knex.raw(`ALTER TABLE users ALTER COLUMN created_by SET NOT NULL`);
  await knex.raw(`ALTER TABLE users ALTER COLUMN updated_by SET NOT NULL`);

  await knex.raw(`CREATE INDEX IF NOT EXISTS users_role_index ON users(role)`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS users_status_index ON users(status)`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS users_created_by_index ON users(created_by)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS users_created_by_index`);
  await knex.raw(`DROP INDEX IF EXISTS users_status_index`);
  await knex.raw(`DROP INDEX IF EXISTS users_role_index`);

  await knex.raw(`ALTER TABLE users ALTER COLUMN name DROP NOT NULL`);
  await knex.raw(`ALTER TABLE users ALTER COLUMN phone DROP NOT NULL`);
  await knex.raw(`ALTER TABLE users ALTER COLUMN role DROP NOT NULL`);
  await knex.raw(`ALTER TABLE users ALTER COLUMN status DROP NOT NULL`);
  await knex.raw(`ALTER TABLE users ALTER COLUMN created_by DROP NOT NULL`);
  await knex.raw(`ALTER TABLE users ALTER COLUMN updated_by DROP NOT NULL`);
}
