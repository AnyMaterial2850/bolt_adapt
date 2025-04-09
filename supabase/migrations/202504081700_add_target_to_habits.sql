alter table habits
add column if not exists target numeric;

alter table habits
add column if not exists unit text;
