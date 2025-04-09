-- Create a stub function to bypass missing validate_frequency_details
create or replace function validate_frequency_details(freq text, details jsonb)
returns boolean
language plpgsql
as $$
begin
  return true;
end;
$$;
