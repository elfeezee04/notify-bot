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
    fetchCourses();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("fullname");

      if (error) throw error;
      setStudents(data || []);
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
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("course_code");

      if (error) throw error;
      setCourses(data || []);
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
          Select a student and course to add their result
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
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.course_code} - {course.course_name}
                    </SelectItem>
                  ))}
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
