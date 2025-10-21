-- Backfill profiles for results.user_id values missing in profiles
INSERT INTO public.profiles (user_id, fullname, regno, email, department, phone_number)
SELECT r.user_id,
       'Unknown User' AS fullname,
       'N/A' AS regno,
       ('unknown+' || r.user_id || '@example.local') AS email,
       'N/A' AS department,
       'N/A' AS phone_number
FROM public.results r
LEFT JOIN public.profiles p ON p.user_id = r.user_id
WHERE p.user_id IS NULL;

-- Ensure unique profile user mapping for relationship embeds
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'profiles' AND c.conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Drop any existing mismatched FKs so we can recreate with expected names
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND table_name = 'results' AND constraint_name = 'results_user_id_fkey'
  ) THEN
    ALTER TABLE public.results DROP CONSTRAINT results_user_id_fkey;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND table_name = 'results' AND constraint_name = 'results_course_id_fkey'
  ) THEN
    ALTER TABLE public.results DROP CONSTRAINT results_course_id_fkey;
  END IF;
END $$;

-- Recreate foreign keys with the exact names used by the client embed hints
ALTER TABLE public.results
  ADD CONSTRAINT results_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(user_id)
  ON DELETE CASCADE;

ALTER TABLE public.results
  ADD CONSTRAINT results_course_id_fkey
  FOREIGN KEY (course_id)
  REFERENCES public.courses(id)
  ON DELETE SET NULL;

-- Helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_results_user_id ON public.results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_course_id ON public.results(course_id);