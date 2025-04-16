-- Add new columns to chat_messages for API compatibility
ALTER TABLE public.chat_messages
ADD COLUMN name TEXT NOT NULL DEFAULT 'User',
ADD COLUMN type TEXT NOT NULL DEFAULT 'human';

-- Migrate existing data based on the old is_ai column
-- Assumes 'Sonia' is the AI name
UPDATE public.chat_messages
SET name = CASE WHEN is_ai THEN 'Sonia' ELSE 'User' END,
    type = CASE WHEN is_ai THEN 'ai' ELSE 'human' END;

-- Note: The 'is_ai' column is kept for potential backward compatibility or debugging.
-- It can be dropped later if deemed unnecessary:
-- ALTER TABLE public.chat_messages DROP COLUMN is_ai;
