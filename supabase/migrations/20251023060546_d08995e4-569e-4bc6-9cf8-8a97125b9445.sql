-- Create student_courses junction table for course enrollment
CREATE TABLE IF NOT EXISTS public.student_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Enable RLS on student_courses
ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;

-- Students can view their own enrollments
CREATE POLICY "Students can view their own course enrollments"
  ON public.student_courses
  FOR SELECT
  USING (auth.uid() = student_id);

-- Students can enroll in courses
CREATE POLICY "Students can enroll in courses"
  ON public.student_courses
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can unenroll from courses
CREATE POLICY "Students can unenroll from courses"
  ON public.student_courses
  FOR DELETE
  USING (auth.uid() = student_id);

-- Admins can view all enrollments
CREATE POLICY "Admins can view all course enrollments"
  ON public.student_courses
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_student_courses_student_id ON public.student_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_course_id ON public.student_courses(course_id);