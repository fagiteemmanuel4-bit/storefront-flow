-- The staff UI supports inventory, sales and viewer roles. Keep the shared
-- store_role enum aligned with the supported staff role vocabulary.
ALTER TYPE public.store_role ADD VALUE IF NOT EXISTS 'inventory';
ALTER TYPE public.store_role ADD VALUE IF NOT EXISTS 'sales';
ALTER TYPE public.store_role ADD VALUE IF NOT EXISTS 'viewer';
