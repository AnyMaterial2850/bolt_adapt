/*
  # Analytics Engine Functions

  1. Core Functions
    - calculate_completion_score: Calculates habit completion score
    - analyze_time_blocks: Analyzes performance in different time blocks
    - detect_patterns: Detects day-of-week and seasonal patterns
    - update_analytics: Main function to update all analytics

  2. Helper Functions
    - get_completion_data: Retrieves completion data for analysis
    - calculate_trend: Calculates trend between two periods
    - identify_best_worst_blocks: Identifies best and worst performing time blocks

  3. Triggers
    - Auto-update analytics when completions change
*/

-- Helper function to get completion data
CREATE OR REPLACE FUNCTION get_completion_data(
  p_user_habit_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  completion_date date,
  event_time time,
  is_completed boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH scheduled_times AS (
    -- Get all scheduled times for the habit
    SELECT 
      d::date as date,
      s.event_time
    FROM generate_series(p_start_date, p_end_date, '1 day'::interval) d
    CROSS JOIN LATERAL (
      SELECT event_time
      FROM jsonb_array_elements(
        (SELECT daily_schedules->day_of_week.day->'schedules'
         FROM user_habits,
         LATERAL (SELECT to_char(d, 'Dy') as day) day_of_week
         WHERE id = p_user_habit_id)
      ) as schedule
      CROSS JOIN LATERAL json_to_record(schedule::json) as s(event_time time)
    ) s
  )
  SELECT
    st.date as completion_date,
    st.event_time,
    COALESCE(hc.id IS NOT NULL, false) as is_completed
  FROM scheduled_times st
  LEFT JOIN habit_completions hc ON
    hc.user_habit_id = p_user_habit_id AND
    hc.date = st.date AND
    hc.event_time = st.event_time;
END;
$$ LANGUAGE plpgsql;

-- Calculate completion score
CREATE OR REPLACE FUNCTION calculate_completion_score(
  p_user_habit_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS numeric AS $$
DECLARE
  v_total integer;
  v_completed integer;
BEGIN
  SELECT 
    count(*),
    count(*) FILTER (WHERE is_completed)
  INTO v_total, v_completed
  FROM get_completion_data(p_user_habit_id, p_start_date, p_end_date);

  RETURN CASE 
    WHEN v_total = 0 THEN 0
    ELSE (v_completed::numeric / v_total * 100)::numeric(5,2)
  END;
END;
$$ LANGUAGE plpgsql;

-- Analyze time blocks
CREATE OR REPLACE FUNCTION analyze_time_blocks(
  p_user_habit_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  time_block tstzrange,
  completion_count integer,
  total_scheduled integer,
  success_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH time_blocks AS (
    SELECT 
      tstzrange(
        date_trunc('hour', (completion_date + event_time)::timestamp),
        date_trunc('hour', (completion_date + event_time)::timestamp) + interval '1 hour'
      ) as time_block,
      is_completed
    FROM get_completion_data(p_user_habit_id, p_start_date, p_end_date)
  )
  SELECT
    tb.time_block,
    count(*) FILTER (WHERE is_completed) as completion_count,
    count(*) as total_scheduled,
    (count(*) FILTER (WHERE is_completed)::numeric / count(*) * 100)::numeric(5,2) as success_rate
  FROM time_blocks tb
  GROUP BY tb.time_block
  HAVING count(*) > 0;
END;
$$ LANGUAGE plpgsql;

-- Detect patterns
CREATE OR REPLACE FUNCTION detect_patterns(
  p_user_habit_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS jsonb AS $$
DECLARE
  v_day_pattern jsonb;
  v_seasonal_pattern jsonb;
BEGIN
  -- Calculate day of week pattern
  WITH day_stats AS (
    SELECT 
      to_char(completion_date, 'Dy') as day,
      count(*) FILTER (WHERE is_completed)::numeric / count(*) * 100 as success_rate
    FROM get_completion_data(p_user_habit_id, p_start_date, p_end_date)
    GROUP BY to_char(completion_date, 'Dy')
  )
  SELECT jsonb_object_agg(day, success_rate)
  INTO v_day_pattern
  FROM day_stats;

  -- Calculate seasonal pattern
  WITH season_stats AS (
    SELECT 
      CASE 
        WHEN EXTRACT(month FROM completion_date) IN (12,1,2) THEN 'winter'
        WHEN EXTRACT(month FROM completion_date) IN (3,4,5) THEN 'spring'
        WHEN EXTRACT(month FROM completion_date) IN (6,7,8) THEN 'summer'
        ELSE 'fall'
      END as season,
      count(*) FILTER (WHERE is_completed)::numeric / count(*) * 100 as success_rate
    FROM get_completion_data(p_user_habit_id, p_start_date, p_end_date)
    GROUP BY 
      CASE 
        WHEN EXTRACT(month FROM completion_date) IN (12,1,2) THEN 'winter'
        WHEN EXTRACT(month FROM completion_date) IN (3,4,5) THEN 'spring'
        WHEN EXTRACT(month FROM completion_date) IN (6,7,8) THEN 'summer'
        ELSE 'fall'
      END
  )
  SELECT jsonb_object_agg(season, success_rate)
  INTO v_seasonal_pattern
  FROM season_stats;

  RETURN jsonb_build_object(
    'day_of_week', v_day_pattern,
    'seasonal', v_seasonal_pattern
  );
END;
$$ LANGUAGE plpgsql;

-- Calculate trend
CREATE OR REPLACE FUNCTION calculate_trend(
  p_user_habit_id uuid,
  p_current_score numeric,
  p_start_date date,
  p_end_date date
)
RETURNS numeric AS $$
DECLARE
  v_previous_score numeric;
  v_period_length integer;
BEGIN
  -- Calculate period length in days
  v_period_length := p_end_date - p_start_date + 1;
  
  -- Get previous period score
  v_previous_score := calculate_completion_score(
    p_user_habit_id,
    p_start_date - v_period_length::integer,
    p_end_date - v_period_length::integer
  );

  -- Calculate trend (percentage point change)
  RETURN CASE 
    WHEN v_previous_score = 0 THEN 0
    ELSE (p_current_score - v_previous_score)::numeric(5,2)
  END;
END;
$$ LANGUAGE plpgsql;

-- Main analytics update function
CREATE OR REPLACE FUNCTION update_habit_analytics(
  p_user_habit_id uuid,
  p_analysis_period tstzrange DEFAULT tstzrange(
    date_trunc('day', now() - interval '30 days'),
    date_trunc('day', now()),
    '[)'
  )
)
RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_completion_score numeric;
  v_completion_trend numeric;
  v_patterns jsonb;
  v_time_blocks record;
  v_best_block jsonb;
  v_worst_block jsonb;
BEGIN
  -- Get user_id
  SELECT user_id INTO v_user_id
  FROM user_habits
  WHERE id = p_user_habit_id;

  -- Calculate completion score
  v_completion_score := calculate_completion_score(
    p_user_habit_id,
    lower(p_analysis_period)::date,
    upper(p_analysis_period)::date
  );

  -- Calculate trend
  v_completion_trend := calculate_trend(
    p_user_habit_id,
    v_completion_score,
    lower(p_analysis_period)::date,
    upper(p_analysis_period)::date
  );

  -- Detect patterns
  v_patterns := detect_patterns(
    p_user_habit_id,
    lower(p_analysis_period)::date,
    upper(p_analysis_period)::date
  );

  -- Find best and worst time blocks
  FOR v_time_blocks IN
    SELECT * FROM analyze_time_blocks(
      p_user_habit_id,
      lower(p_analysis_period)::date,
      upper(p_analysis_period)::date
    )
    ORDER BY success_rate DESC
  LOOP
    IF v_best_block IS NULL THEN
      v_best_block := jsonb_build_object(
        'time_block', v_time_blocks.time_block,
        'success_rate', v_time_blocks.success_rate
      );
    END IF;
    
    IF v_worst_block IS NULL OR v_time_blocks.success_rate < (v_worst_block->>'success_rate')::numeric THEN
      v_worst_block := jsonb_build_object(
        'time_block', v_time_blocks.time_block,
        'success_rate', v_time_blocks.success_rate
      );
    END IF;
  END LOOP;

  -- Update analytics
  INSERT INTO user_habit_analytics (
    user_habit_id,
    user_id,
    completion_score,
    completion_trend,
    best_time_block,
    worst_time_block,
    day_of_week_pattern,
    seasonal_pattern,
    analysis_period
  )
  VALUES (
    p_user_habit_id,
    v_user_id,
    v_completion_score,
    v_completion_trend,
    v_best_block,
    v_worst_block,
    v_patterns->'day_of_week',
    v_patterns->'seasonal',
    p_analysis_period
  )
  ON CONFLICT (user_habit_id, analysis_period)
  DO UPDATE SET
    completion_score = EXCLUDED.completion_score,
    completion_trend = EXCLUDED.completion_trend,
    best_time_block = EXCLUDED.best_time_block,
    worst_time_block = EXCLUDED.worst_time_block,
    day_of_week_pattern = EXCLUDED.day_of_week_pattern,
    seasonal_pattern = EXCLUDED.seasonal_pattern,
    updated_at = now();

  -- Update time blocks
  INSERT INTO user_habit_time_blocks (
    user_habit_id,
    user_id,
    time_block,
    completion_count,
    total_scheduled,
    success_rate
  )
  SELECT
    p_user_habit_id,
    v_user_id,
    time_block,
    completion_count,
    total_scheduled,
    success_rate
  FROM analyze_time_blocks(
    p_user_habit_id,
    lower(p_analysis_period)::date,
    upper(p_analysis_period)::date
  )
  ON CONFLICT (user_habit_id, time_block)
  DO UPDATE SET
    completion_count = EXCLUDED.completion_count,
    total_scheduled = EXCLUDED.total_scheduled,
    success_rate = EXCLUDED.success_rate,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update analytics on completion changes
CREATE OR REPLACE FUNCTION trigger_update_habit_analytics()
RETURNS trigger AS $$
BEGIN
  -- Schedule analytics update
  PERFORM update_habit_analytics(
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.user_habit_id
      ELSE NEW.user_habit_id
    END
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on habit_completions
DROP TRIGGER IF EXISTS update_analytics_on_completion ON habit_completions;
CREATE TRIGGER update_analytics_on_completion
  AFTER INSERT OR UPDATE OR DELETE ON habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_habit_analytics();

-- Add helpful comments
COMMENT ON FUNCTION update_habit_analytics IS 'Updates analytics for a user habit';
COMMENT ON FUNCTION calculate_completion_score IS 'Calculates completion score for a habit';
COMMENT ON FUNCTION analyze_time_blocks IS 'Analyzes performance in different time blocks';
COMMENT ON FUNCTION detect_patterns IS 'Detects day-of-week and seasonal patterns';