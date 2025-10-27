-- Add level and semester columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN level text,
ADD COLUMN semester text;

-- Update existing rows to have default values (optional, can be left as NULL)
COMMENT ON COLUMN public.profiles.level IS 'Student academic level (e.g., 100, 200, 300, 400)';
COMMENT ON COLUMN public.profiles.semester IS 'Current semester (e.g., First, Second)';