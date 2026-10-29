-- Persist each account's light/dark/system theme choice.
-- Idempotent so this can safely run against environments where the column
-- was added manually before migrations were brought back in sync.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'system';

UPDATE public.profiles
SET theme_preference = 'system'
WHERE theme_preference IS NULL
   OR theme_preference NOT IN ('system', 'light', 'dark');

ALTER TABLE public.profiles
  ALTER COLUMN theme_preference SET DEFAULT 'system',
  ALTER COLUMN theme_preference SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_theme_preference_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_theme_preference_check
      CHECK (theme_preference IN ('system', 'light', 'dark'));
  END IF;
END
$$;
