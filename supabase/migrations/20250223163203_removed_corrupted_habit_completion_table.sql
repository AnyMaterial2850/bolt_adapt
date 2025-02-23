-- Drop the old table if it exists
DROP TABLE IF EXISTS public.habit_completions;

-- Create the new table
CREATE TABLE IF NOT EXISTS public.habit_comp_track (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_habit_id UUID NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
    date DATE NULL DEFAULT current_date,
    evt_time TIME WITHOUT TIME ZONE NULL,
    last_completion_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
    reminder_time TIME WITHOUT TIME ZONE NULL,
    CONSTRAINT habit_comp_pkey PRIMARY KEY (id),
    CONSTRAINT habit_comp_unique_completion UNIQUE (user_habit_id, date, evt_time),
    CONSTRAINT habit_comp_user_habit_id_fkey FOREIGN KEY (user_habit_id) REFERENCES user_habits (id) ON DELETE CASCADE
) TABLESPACE pg_default;