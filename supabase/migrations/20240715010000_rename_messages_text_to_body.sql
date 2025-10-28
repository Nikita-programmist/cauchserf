-- Ensure the messages table uses the new body column name in existing environments
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'text'
  ) THEN
    ALTER TABLE public.messages RENAME COLUMN text TO body;
  END IF;
END $$;
