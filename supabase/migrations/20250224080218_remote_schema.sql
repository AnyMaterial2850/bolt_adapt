revoke delete on table "public"."habit_comp_track" from "anon";

revoke insert on table "public"."habit_comp_track" from "anon";

revoke references on table "public"."habit_comp_track" from "anon";

revoke select on table "public"."habit_comp_track" from "anon";

revoke trigger on table "public"."habit_comp_track" from "anon";

revoke truncate on table "public"."habit_comp_track" from "anon";

revoke update on table "public"."habit_comp_track" from "anon";

revoke delete on table "public"."habit_comp_track" from "authenticated";

revoke insert on table "public"."habit_comp_track" from "authenticated";

revoke references on table "public"."habit_comp_track" from "authenticated";

revoke select on table "public"."habit_comp_track" from "authenticated";

revoke trigger on table "public"."habit_comp_track" from "authenticated";

revoke truncate on table "public"."habit_comp_track" from "authenticated";

revoke update on table "public"."habit_comp_track" from "authenticated";

revoke delete on table "public"."habit_comp_track" from "service_role";

revoke insert on table "public"."habit_comp_track" from "service_role";

revoke references on table "public"."habit_comp_track" from "service_role";

revoke select on table "public"."habit_comp_track" from "service_role";

revoke trigger on table "public"."habit_comp_track" from "service_role";

revoke truncate on table "public"."habit_comp_track" from "service_role";

revoke update on table "public"."habit_comp_track" from "service_role";

alter table "public"."habit_comp_track" drop constraint "habit_comp_unique_completion";

alter table "public"."habit_comp_track" drop constraint "habit_comp_user_habit_id_fkey";

alter table "public"."user_habits" drop constraint "user_habits_user_id_habit_id_key";

alter table "public"."habit_comp_track" drop constraint "habit_comp_pkey";

drop index if exists "public"."habit_comp_pkey";

drop index if exists "public"."habit_comp_unique_completion";

drop index if exists "public"."idx_user_habits_user_id_habit_id";

drop index if exists "public"."user_habits_user_id_habit_id_key";

drop table "public"."habit_comp_track";

create table "public"."habit_completions" (
    "id" uuid not null default gen_random_uuid(),
    "user_habit_id" uuid,
    "completed_at" timestamp with time zone default now(),
    "date" date default CURRENT_DATE,
    "event_time" time without time zone,
    "last_completion_at" timestamp with time zone default now(),
    "reminder_time" time without time zone
);


alter table "public"."habit_completions" enable row level security;

CREATE UNIQUE INDEX habit_completions_pkey ON public.habit_completions USING btree (id);

CREATE UNIQUE INDEX habit_completions_unique_completion ON public.habit_completions USING btree (user_habit_id, date, event_time);

CREATE INDEX idx_habit_completions_composite ON public.habit_completions USING btree (user_habit_id, date, event_time);

CREATE INDEX idx_habit_completions_date ON public.habit_completions USING btree (date);

CREATE INDEX idx_habit_completions_event_time ON public.habit_completions USING btree (event_time);

CREATE INDEX idx_habit_completions_last_completion_at ON public.habit_completions USING btree (last_completion_at);

CREATE INDEX idx_habit_completions_lookup ON public.habit_completions USING btree (user_habit_id, date, event_time);

CREATE INDEX idx_habit_completions_user_habit ON public.habit_completions USING btree (user_habit_id);

CREATE UNIQUE INDEX user_habits_user_id_habit_id_key ON public.user_habits USING btree (user_id, habit_id);

alter table "public"."habit_completions" add constraint "habit_completions_pkey" PRIMARY KEY using index "habit_completions_pkey";

alter table "public"."habit_completions" add constraint "habit_completions_unique_completion" UNIQUE using index "habit_completions_unique_completion";

alter table "public"."habit_completions" add constraint "habit_completions_user_habit_id_fkey" FOREIGN KEY (user_habit_id) REFERENCES user_habits(id) ON DELETE CASCADE not valid;

alter table "public"."habit_completions" validate constraint "habit_completions_user_habit_id_fkey";

alter table "public"."user_habits" add constraint "user_habits_user_id_habit_id_key" UNIQUE using index "user_habits_user_id_habit_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.validate_frequency_details(p_frequency habit_frequency, p_details jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_days text[];
  v_meals text[];
BEGIN
  -- Handle null case
  IF p_details IS NULL THEN
    RETURN true;
  END IF;

  -- Validate based on frequency type
  CASE p_frequency
    WHEN 'daily' THEN
      RETURN jsonb_typeof(p_details) = 'object';
      
    WHEN 'days_per_week' THEN
      v_days := ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      RETURN (
        p_details ? 'days' AND
        jsonb_array_length(p_details->'days') > 0 AND
        jsonb_array_length(p_details->'days') <= 7 AND
        (SELECT bool_and(elem::text = ANY(v_days))
         FROM jsonb_array_elements_text(p_details->'days') elem)
      );
      
    WHEN 'times_per_week' THEN
      RETURN (
        p_details ? 'target' AND
        (p_details->>'target')::int > 0 AND
        (p_details->>'target')::int <= 7 AND
        p_details ? 'minimum_rest_days' AND
        (p_details->>'minimum_rest_days')::int >= 0
      );
      
    WHEN 'after_meals' THEN
      v_meals := ARRAY['breakfast', 'lunch', 'dinner'];
      RETURN (
        p_details ? 'meals' AND
        jsonb_array_length(p_details->'meals') > 0 AND
        (SELECT bool_and(elem::text = ANY(v_meals))
         FROM jsonb_array_elements_text(p_details->'meals') elem) AND
        p_details ? 'window' AND
        (p_details->'window' ? 'minutes_after') AND
        (p_details->'window' ? 'duration_minutes')
      );
      
    WHEN 'times_per_day' THEN
      RETURN (
        p_details ? 'target' AND
        (p_details->>'target')::int > 0 AND
        p_details ? 'minimum_interval_minutes' AND
        (p_details->>'minimum_interval_minutes')::int > 0
      );
      
    WHEN 'specific_times' THEN
      RETURN (
        p_details ? 'times' AND
        jsonb_array_length(p_details->'times') > 0 AND
        p_details ? 'flexible_window_minutes' AND
        (p_details->>'flexible_window_minutes')::int >= 0 AND
        (SELECT bool_and(elem::text ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$')
         FROM jsonb_array_elements_text(p_details->'times') elem)
      );
      
    ELSE
      RETURN false;
  END CASE;
END;
$function$
;

grant delete on table "public"."habit_completions" to "anon";

grant insert on table "public"."habit_completions" to "anon";

grant references on table "public"."habit_completions" to "anon";

grant select on table "public"."habit_completions" to "anon";

grant trigger on table "public"."habit_completions" to "anon";

grant truncate on table "public"."habit_completions" to "anon";

grant update on table "public"."habit_completions" to "anon";

grant delete on table "public"."habit_completions" to "authenticated";

grant insert on table "public"."habit_completions" to "authenticated";

grant references on table "public"."habit_completions" to "authenticated";

grant select on table "public"."habit_completions" to "authenticated";

grant trigger on table "public"."habit_completions" to "authenticated";

grant truncate on table "public"."habit_completions" to "authenticated";

grant update on table "public"."habit_completions" to "authenticated";

grant delete on table "public"."habit_completions" to "service_role";

grant insert on table "public"."habit_completions" to "service_role";

grant references on table "public"."habit_completions" to "service_role";

grant select on table "public"."habit_completions" to "service_role";

grant trigger on table "public"."habit_completions" to "service_role";

grant truncate on table "public"."habit_completions" to "service_role";

grant update on table "public"."habit_completions" to "service_role";

create policy "Users can delete their own completions"
on "public"."habit_completions"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_habits
  WHERE ((user_habits.id = habit_completions.user_habit_id) AND (user_habits.user_id = auth.uid())))));


create policy "Users can insert their own completions"
on "public"."habit_completions"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM user_habits
  WHERE ((user_habits.id = habit_completions.user_habit_id) AND (user_habits.user_id = auth.uid())))));


create policy "Users can manage their own completions"
on "public"."habit_completions"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_habits
  WHERE ((user_habits.id = habit_completions.user_habit_id) AND (user_habits.user_id = auth.uid())))));


create policy "Users can view their own completions"
on "public"."habit_completions"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_habits
  WHERE ((user_habits.id = habit_completions.user_habit_id) AND (user_habits.user_id = auth.uid())))));


CREATE TRIGGER update_analytics_on_completion AFTER INSERT OR DELETE OR UPDATE ON public.habit_completions FOR EACH ROW EXECUTE FUNCTION trigger_update_habit_analytics();

CREATE TRIGGER update_habit_completion_timestamp_trigger BEFORE UPDATE ON public.habit_completions FOR EACH ROW EXECUTE FUNCTION update_habit_completion_timestamp();

CREATE TRIGGER validate_completion_date_trigger BEFORE INSERT OR UPDATE ON public.habit_completions FOR EACH ROW EXECUTE FUNCTION validate_completion_date();


