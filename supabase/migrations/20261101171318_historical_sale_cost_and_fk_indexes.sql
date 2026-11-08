-- Preserve product unit cost at the time a sale line is written.
-- Historical rows remain NULL: their original cost cannot be reconstructed safely.
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS unit_cost_at_sale numeric(12, 2);

COMMENT ON COLUMN public.sale_items.unit_cost_at_sale IS
  'Product cost per base unit captured when the sale line is created; NULL for legacy rows where historical cost is unknown.';

CREATE OR REPLACE FUNCTION public.capture_sale_item_unit_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.unit_cost_at_sale IS NULL AND NEW.product_id IS NOT NULL THEN
    SELECT p.cost
      INTO NEW.unit_cost_at_sale
      FROM public.products AS p
     WHERE p.id = NEW.product_id
       AND p.store_id = NEW.store_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sale_items_capture_unit_cost ON public.sale_items;
CREATE TRIGGER sale_items_capture_unit_cost
BEFORE INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.capture_sale_item_unit_cost();

-- Add a leading-column btree index for each public foreign key that lacks one.
-- This is deliberately schema-driven so composite foreign keys are handled correctly.
DO $$
DECLARE
  fk record;
  index_name text;
  column_list text;
BEGIN
  FOR fk IN
    SELECT
      c.oid,
      c.conrelid,
      c.conname,
      c.conkey,
      n.nspname AS schema_name,
      t.relname AS table_name,
      ARRAY(
        SELECT a.attname
          FROM unnest(c.conkey) WITH ORDINALITY AS key_col(attnum, ord)
          JOIN pg_attribute AS a
            ON a.attrelid = c.conrelid
           AND a.attnum = key_col.attnum
         ORDER BY key_col.ord
      ) AS column_names
    FROM pg_constraint AS c
    JOIN pg_class AS t ON t.oid = c.conrelid
    JOIN pg_namespace AS n ON n.oid = t.relnamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1
          FROM pg_index AS i
         WHERE i.indrelid = c.conrelid
           AND i.indisvalid
           AND i.indpred IS NULL
           AND (
             SELECT array_agg(index_col.attnum ORDER BY index_col.ord)
               FROM unnest(i.indkey::smallint[]) WITH ORDINALITY AS index_col(attnum, ord)
              WHERE index_col.ord <= cardinality(c.conkey)
           ) = c.conkey
      )
  LOOP
    index_name := left(fk.table_name || '_' || fk.conname || '_idx', 63);
    SELECT string_agg(format('%I', col), ', ')
      INTO column_list
      FROM unnest(fk.column_names) AS col;

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I.%I (%s)',
      index_name,
      fk.schema_name,
      fk.table_name,
      column_list
    );
  END LOOP;
END;
$$;
