import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";

interface Student {
  user_id: string;
  fullname: string;
  regno: string;
  email: string;
}

interface Course {
  id: string;
  course_code: string;
  course_name: string;
}

interface AddResultFormProps {
  onSuccess: () => void;
}

export default function AddResultForm({ onSuccess }: AddResultFormProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [score, setScore] = useState("");
  const [grade, setGrade] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      // Primary: fetch all student profiles (admins can view all)
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, fullname, regno, email")
        .order("fullname");

      if (error) throw error;

      let list: Student[] = (data as Student[]) || [];
      console.debug("[AddResultForm] profiles fetched:", list.length);

      // Fallback: if empty, try enrolled students join (older data setups)
      if (list.length === 0) {
        const { data: joined, error: joinError } = await supabase
          .from("student_courses")
          .select(`
            student_id,
            profiles!student_courses_student_id_fkey (
              user_id,
              fullname,
              regno,
              email
            )
          `);
        if (joinError) throw joinError;

        const uniqueStudents = Array.from(
          new Map(
            joined?.map((item: any) => [
              item.profiles.user_id,
              {
                user_id: item.profiles.user_id,
                fullname: item.profiles.fullname,
                regno: item.profiles.regno,
                email: item.profiles.email,
              } as Student
            ])
          ).values()
        );
        console.debug("[AddResultForm] fallback joined students:", uniqueStudents.length);
        list = uniqueStudents;
      }

      list.sort((a, b) => a.fullname.localeCompare(b.fullname));
      setStudents(list);
    } catch (error: any) {
      toast({
        title: "Failed to fetch students",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchCourses = async () => {
    try {
      if (!selectedStudent) {
        setCourses([]);
        return;
      }

      // Fetch only courses the selected student is enrolled in
      const { data, error } = await supabase
        .from("student_courses")
        .select(`
          courses (
            id,
            course_code,
            course_name
          )
        `)
        .eq("student_id", selectedStudent);

      if (error) throw error;
      
      const enrolledCourses = data?.map((item: any) => item.courses) || [];
      setCourses(enrolledCourses);
    } catch (error: any) {
      toast({
        title: "Failed to fetch courses",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent || !selectedCourse || !score || !grade) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("results").insert({
        user_id: selectedStudent,
        course_id: selectedCourse,
        score,
        grade,
        remarks: remarks || null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Result added successfully!",
        description: "The result has been saved and is ready to be sent",
      });

      setSelectedStudent("");
      setSelectedCourse("");
      setScore("");
      setGrade("");
      setRemarks("");
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Failed to add result",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Result</CardTitle>
        <CardDescription>
          Select a student and their enrolled course to add a result
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="student">Select Student *</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.user_id} value={student.user_id}>
                      {student.fullname} ({student.regno})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Select Course *</Label>
              <Select 
                value={selectedCourse} 
                onValueChange={setSelectedCourse}
                disabled={!selectedStudent}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedStudent ? "Choose a course" : "Select student first"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.length === 0 && selectedStudent ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Student not enrolled in any courses
                    </div>
                  ) : (
                    courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.course_code} - {course.course_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="score">Score *</Label>
              <Input
                id="score"
                placeholder="e.g., 85/100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade *</Label>
              <Input
                id="grade"
                placeholder="e.g., A, B+, C"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              placeholder="Excellent performance! Keep up the good work."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              "Adding..."
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Result
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
