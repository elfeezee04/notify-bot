import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Course {
  id: string;
  course_code: string;
  course_name: string;
}

interface EnrolledCourse extends Course {
  enrollment_id: string;
  enrolled_at: string;
}

export default function CourseEnrollment() {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch enrolled courses
      const { data: enrolled, error: enrolledError } = await supabase
        .from("student_courses")
        .select(`
          id,
          enrolled_at,
          courses (
            id,
            course_code,
            course_name
          )
        `)
        .eq("student_id", user.id);

      if (enrolledError) throw enrolledError;

      const enrolledCoursesData = enrolled?.map((e: any) => ({
        enrollment_id: e.id,
        id: e.courses.id,
        course_code: e.courses.course_code,
        course_name: e.courses.course_name,
        enrolled_at: e.enrolled_at,
      })) || [];

      setEnrolledCourses(enrolledCoursesData);

      // Fetch all courses
      const { data: allCourses, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .order("course_code");

      if (coursesError) throw coursesError;

      // Filter out enrolled courses
      const enrolledIds = enrolledCoursesData.map((c: EnrolledCourse) => c.id);
      const available = allCourses?.filter((c: Course) => !enrolledIds.includes(c.id)) || [];
      setAvailableCourses(available);
    } catch (error: any) {
      toast.error("Failed to fetch courses");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("student_courses")
        .insert({
          student_id: user.id,
          course_id: courseId,
        });

      if (error) throw error;

      toast.success("Successfully enrolled in course!");
      setDialogOpen(false);
      fetchCourses();
    } catch (error: any) {
      toast.error("Failed to enroll in course");
      console.error(error);
    }
  };

  const handleUnenroll = async (enrollmentId: string) => {
    if (!confirm("Are you sure you want to unenroll from this course?")) return;

    try {
      const { error } = await supabase
        .from("student_courses")
        .delete()
        .eq("id", enrollmentId);

      if (error) throw error;

      toast.success("Successfully unenrolled from course");
      fetchCourses();
    } catch (error: any) {
      toast.error("Failed to unenroll from course");
      console.error(error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Enrolled Courses
              </CardTitle>
              <CardDescription>
                Courses you are currently registered for
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Enroll in Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Available Courses</DialogTitle>
                  <DialogDescription>
                    Select a course to enroll in
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto">
                  {availableCourses.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      No available courses to enroll in
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availableCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <p className="font-medium">{course.course_code}</p>
                            <p className="text-sm text-muted-foreground">
                              {course.course_name}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleEnroll(course.id)}
                          >
                            Enroll
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                You haven't enrolled in any courses yet
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Enroll in Your First Course
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Enrolled Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledCourses.map((course) => (
                    <TableRow key={course.enrollment_id}>
                      <TableCell className="font-medium">
                        {course.course_code}
                      </TableCell>
                      <TableCell>{course.course_name}</TableCell>
                      <TableCell>
                        {new Date(course.enrolled_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnenroll(course.enrollment_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
