import type { Knex } from 'knex';

const FUNCTION_NAME = 'sync_products_active_with_stock';
const TRIGGER_NAME = 'trg_sync_products_active_with_stock';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NEW.current_stock <= 0 THEN
        NEW.is_active := FALSE;
      ELSE
        NEW.is_active := TRUE;
      END IF;

      RETURN NEW;
    END;
    $$;
  `);

  await knex.raw(`
    DROP TRIGGER IF EXISTS ${TRIGGER_NAME} ON products;
    CREATE TRIGGER ${TRIGGER_NAME}
    BEFORE INSERT OR UPDATE OF current_stock
    ON products
    FOR EACH ROW
    EXECUTE FUNCTION ${FUNCTION_NAME}();
  `);

  await knex.raw(`
    UPDATE products
    SET is_active = CASE WHEN current_stock <= 0 THEN FALSE ELSE TRUE END;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TRIGGER IF EXISTS ${TRIGGER_NAME} ON products;`);
  await knex.raw(`DROP FUNCTION IF EXISTS ${FUNCTION_NAME}();`);
}
