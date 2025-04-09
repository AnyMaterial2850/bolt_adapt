-- Add tracking_type enum and column
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tracking_type') then
    create type tracking_type as enum ('binary', 'numeric', 'range', 'count');
  end if;
end$$;

alter table habits
add column if not exists tracking_type tracking_type;

-- Expand frequency enum or convert to text for flexibility
alter table habits
alter column frequency type text using frequency::text;

-- Add config JSONB column for complex criteria
alter table habits
add column if not exists config jsonb default '{}'::jsonb;

-- Add tags array
alter table habits
add column if not exists tags text[] default array[]::text[];

-- Add difficulty level (1-5 scale)
alter table habits
add column if not exists difficulty int;

-- Create habit_reminders table
create table if not exists habit_reminders (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade,
  reminder_time time,
  days text[] default array[]::text[],
  message text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Create habit_contents table
create table if not exists habit_contents (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade,
  content_type text,
  content_url text,
  content_title text,
  content_description text,
  content_thumbnail_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
