drop trigger if exists "update_analytics_on_completion" on "public"."habit_completions";

drop trigger if exists "update_habit_completion_timestamp_trigger" on "public"."habit_completions";

drop trigger if exists "validate_completion_date_trigger" on "public"."habit_completions";

drop policy "Users can delete their own completions" on "public"."habit_completions";

drop policy "Users can insert their own completions" on "public"."habit_completions";

drop policy "Users can manage their own completions" on "public"."habit_completions";

drop policy "Users can view their own completions" on "public"."habit_completions";

revoke delete on table "public"."habit_completions" from "anon";

revoke insert on table "public"."habit_completions" from "anon";

revoke references on table "public"."habit_completions" from "anon";

revoke select on table "public"."habit_completions" from "anon";

revoke trigger on table "public"."habit_completions" from "anon";

revoke truncate on table "public"."habit_completions" from "anon";

revoke update on table "public"."habit_completions" from "anon";

revoke delete on table "public"."habit_completions" from "authenticated";

revoke insert on table "public"."habit_completions" from "authenticated";

revoke references on table "public"."habit_completions" from "authenticated";

revoke select on table "public"."habit_completions" from "authenticated";

revoke trigger on table "public"."habit_completions" from "authenticated";

revoke truncate on table "public"."habit_completions" from "authenticated";

revoke update on table "public"."habit_completions" from "authenticated";

revoke delete on table "public"."habit_completions" from "service_role";

revoke insert on table "public"."habit_completions" from "service_role";

revoke references on table "public"."habit_completions" from "service_role";

revoke select on table "public"."habit_completions" from "service_role";

revoke trigger on table "public"."habit_completions" from "service_role";

revoke truncate on table "public"."habit_completions" from "service_role";

revoke update on table "public"."habit_completions" from "service_role";

alter table "public"."habit_completions" drop constraint "habit_completions_unique_completion";

alter table "public"."habit_completions" drop constraint "habit_completions_user_habit_id_fkey";

alter table "public"."user_habits" drop constraint "user_habits_user_id_habit_id_key";

alter table "public"."habit_completions" drop constraint "habit_completions_pkey";

drop index if exists "public"."habit_completions_pkey";

drop index if exists "public"."habit_completions_unique_completion";

drop index if exists "public"."idx_habit_completions_composite";

drop index if exists "public"."idx_habit_completions_date";

drop index if exists "public"."idx_habit_completions_event_time";

drop index if exists "public"."idx_habit_completions_last_completion_at";

drop index if exists "public"."idx_habit_completions_lookup";

drop index if exists "public"."idx_habit_completions_user_habit";

drop index if exists "public"."user_habits_user_id_habit_id_key";

drop table "public"."habit_completions";

create table "public"."habit_comp_track" (
    "id" uuid not null default gen_random_uuid(),
    "user_habit_id" uuid,
    "completed_at" timestamp with time zone default now(),
    "date" date default CURRENT_DATE,
    "evt_time" time without time zone,
    "last_completion_at" timestamp with time zone default now(),
    "reminder_time" time without time zone
);


CREATE UNIQUE INDEX habit_comp_pkey ON public.habit_comp_track USING btree (id);

CREATE UNIQUE INDEX habit_comp_unique_completion ON public.habit_comp_track USING btree (user_habit_id, date, evt_time);

CREATE INDEX idx_user_habits_user_id_habit_id ON public.user_habits USING btree (user_id, habit_id);

CREATE UNIQUE INDEX user_habits_user_id_habit_id_key ON public.user_habits USING btree (user_id, habit_id);

alter table "public"."habit_comp_track" add constraint "habit_comp_pkey" PRIMARY KEY using index "habit_comp_pkey";

alter table "public"."habit_comp_track" add constraint "habit_comp_unique_completion" UNIQUE using index "habit_comp_unique_completion";

alter table "public"."habit_comp_track" add constraint "habit_comp_user_habit_id_fkey" FOREIGN KEY (user_habit_id) REFERENCES user_habits(id) ON DELETE CASCADE not valid;

alter table "public"."habit_comp_track" validate constraint "habit_comp_user_habit_id_fkey";

alter table "public"."user_habits" add constraint "user_habits_user_id_habit_id_key" UNIQUE using index "user_habits_user_id_habit_id_key" DEFERRABLE;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.validate_frequency_details(p_frequency habit_frequency, p_details jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
      RETURN (
        jsonb_typeof(p_details->>'days') = 'array' AND
        jsonb_array_length(p_details->'days') > 0 AND
        jsonb_array_length(p_details->'days') <= 7
      );
      
    WHEN 'times_per_week' THEN
      RETURN (
        (p_details->>'target')::int > 0 AND
        (p_details->>'target')::int <= 7 AND
        (p_details->>'minimum_rest_days')::int >= 0
      );
      
    WHEN 'after_meals' THEN
      RETURN (
        jsonb_typeof(p_details->>'meals') = 'array' AND
        jsonb_array_length(p_details->'meals') > 0 AND
        (p_details->>'window')::jsonb ? 'minutes_after' AND
        (p_details->>'window')::jsonb ? 'duration_minutes'
      );
      
    WHEN 'times_per_day' THEN
      RETURN (
        (p_details->>'target')::int > 0 AND
        (p_details->>'minimum_interval_minutes')::int > 0
      );
      
    WHEN 'specific_times' THEN
      RETURN (
        jsonb_typeof(p_details->>'times') = 'array' AND
        jsonb_array_length(p_details->'times') > 0 AND
        (p_details->>'flexible_window_minutes')::int >= 0
      );
      
    ELSE
      RETURN false;
  END CASE;
END;
$function$
;

grant delete on table "public"."habit_comp_track" to "anon";

grant insert on table "public"."habit_comp_track" to "anon";

grant references on table "public"."habit_comp_track" to "anon";

grant select on table "public"."habit_comp_track" to "anon";

grant trigger on table "public"."habit_comp_track" to "anon";

grant truncate on table "public"."habit_comp_track" to "anon";

grant update on table "public"."habit_comp_track" to "anon";

grant delete on table "public"."habit_comp_track" to "authenticated";

grant insert on table "public"."habit_comp_track" to "authenticated";

grant references on table "public"."habit_comp_track" to "authenticated";

grant select on table "public"."habit_comp_track" to "authenticated";

grant trigger on table "public"."habit_comp_track" to "authenticated";

grant truncate on table "public"."habit_comp_track" to "authenticated";

grant update on table "public"."habit_comp_track" to "authenticated";

grant delete on table "public"."habit_comp_track" to "service_role";

grant insert on table "public"."habit_comp_track" to "service_role";

grant references on table "public"."habit_comp_track" to "service_role";

grant select on table "public"."habit_comp_track" to "service_role";

grant trigger on table "public"."habit_comp_track" to "service_role";

grant truncate on table "public"."habit_comp_track" to "service_role";

grant update on table "public"."habit_comp_track" to "service_role";


