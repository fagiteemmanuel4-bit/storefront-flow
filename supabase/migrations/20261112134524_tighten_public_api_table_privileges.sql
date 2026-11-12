-- Browser-facing roles do not need schema-level table operations.
-- Keep normal SELECT/INSERT/UPDATE/DELETE grants and existing RLS policies.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
