# Unreconciled historical migration candidates

These SQL files existed in the application repository but their filename versions are not present in the linked production database's `supabase_migrations.schema_migrations` history.

They have been moved out of `supabase/migrations/` so that a future `supabase db push` cannot execute them accidentally. Their original contents and filenames are preserved here for manual review.

Do not move a file back into the active migrations directory or apply it until its SQL has been compared against the recovered production migration history and current schema. If a change is still required, create a new, reviewed migration with a fresh timestamp.

The active `supabase/migrations/` directory is intended to contain only the exact applied production versions.
