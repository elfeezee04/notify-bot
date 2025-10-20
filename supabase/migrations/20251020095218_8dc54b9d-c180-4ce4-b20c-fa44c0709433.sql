-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create courses table
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_code text NOT NULL UNIQUE,
  course_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Policies for courses (only admins can manage, everyone can view)
CREATE POLICY "Anyone can view courses"
ON public.courses
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert courses"
ON public.courses
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update courses"
ON public.courses
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete courses"
ON public.courses
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update results table to use foreign keys instead of text fields
ALTER TABLE public.results 
  DROP COLUMN IF EXISTS student_name,
  DROP COLUMN IF EXISTS student_email,
  DROP COLUMN IF EXISTS subject;

-- Add course_id foreign key to results
ALTER TABLE public.results
  ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_results_course_id ON public.results(course_id);
CREATE INDEX idx_courses_code ON public.courses(course_code);

-- Update timestamp trigger for courses
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();