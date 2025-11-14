import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Send, Search, Trash2, Mail } from "lucide-react";

interface Result {
  id: string;
  user_id: string;
  course_id: string;
  score: string;
  grade: string | null;
  remarks: string | null;
  status: string;
  created_at: string;
  sent_at: string | null;
  profiles?: {
    fullname: string;
    regno: string;
    email: string;
    level: string | null;
    semester: string | null;
    department: string;
  };
  courses?: {
    course_code: string;
    course_name: string;
  };
}

interface ResultsTableProps {
  results: Result[];
  onUpdate: () => void;
}

export default function ResultsTable({ results, onUpdate }: ResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingStudentId, setSendingStudentId] = useState<string | null>(null);

  const filteredResults = results.filter((result) =>
    result.profiles?.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.profiles?.regno.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.courses?.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.courses?.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendResult = async (result: Result) => {
    // When sending a single result, we'll actually send all pending results for this student
    const studentPendingResults = results.filter(
      r => r.user_id === result.user_id && r.status === "pending"
    );

    if (studentPendingResults.length === 0) {
      toast({
        title: "No pending results",
        description: "This result has already been sent",
      });
      return;
    }

    setSendingId(result.id);

    try {
      // Calculate GPA (simple average)
      const gradePoints: { [key: string]: number } = {
        'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
      };
      
      const validGrades = studentPendingResults.filter(r => r.grade && gradePoints[r.grade]);
      const gpa = validGrades.length > 0
        ? (validGrades.reduce((sum, r) => sum + (gradePoints[r.grade!] || 0), 0) / validGrades.length).toFixed(2)
        : undefined;

      // Prepare the combined results
      const courseResults = studentPendingResults.map(r => ({
        courseCode: r.courses?.course_code || '',
        courseName: r.courses?.course_name || '',
        score: r.score,
        grade: r.grade || undefined
      }));

      const { error: functionError } = await supabase.functions.invoke("send-result-email", {
        body: {
          studentName: result.profiles?.fullname,
          studentEmail: result.profiles?.email,
          regno: result.profiles?.regno,
          department: result.profiles?.department,
          level: result.profiles?.level,
          semester: result.profiles?.semester,
          results: courseResults,
          gpa: gpa,
          remarks: validGrades.length > 0 ? (parseFloat(gpa!) >= 3.5 ? "Excellent Performance" : parseFloat(gpa!) >= 2.5 ? "Good Performance" : "Fair Performance") : undefined,
          resultIds: studentPendingResults.map(r => r.id)
        },
      });

      if (functionError) throw functionError;

      // Update all pending results for this student as sent
      const { error: updateError } = await supabase
        .from("results")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .in("id", studentPendingResults.map(r => r.id));

      if (updateError) throw updateError;

      toast({
        title: "Results sent successfully!",
        description: `All ${studentPendingResults.length} result(s) sent to ${result.profiles?.email} in a single email`,
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Failed to send result",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleSendStudentResults = async (userId: string, studentName: string) => {
    const studentPendingResults = results.filter(
      r => r.user_id === userId && r.status === "pending"
    );
    
    if (studentPendingResults.length === 0) {
      toast({
        title: "No pending results",
        description: `All results for ${studentName} have already been sent`,
      });
      return;
    }

    setSendingStudentId(userId);

    try {
      // Get the first result to extract student info
      const firstResult = studentPendingResults[0];
      
      // Calculate GPA (simple average for now)
      const gradePoints: { [key: string]: number } = {
        'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
      };
      
      const validGrades = studentPendingResults.filter(r => r.grade && gradePoints[r.grade]);
      const gpa = validGrades.length > 0
        ? (validGrades.reduce((sum, r) => sum + (gradePoints[r.grade!] || 0), 0) / validGrades.length).toFixed(2)
        : undefined;

      // Prepare the combined results
      const courseResults = studentPendingResults.map(r => ({
        courseCode: r.courses?.course_code || '',
        courseName: r.courses?.course_name || '',
        score: r.score,
        grade: r.grade || undefined
      }));

      // Send single email with all results
      const { error: functionError } = await supabase.functions.invoke("send-result-email", {
        body: {
          studentName: firstResult.profiles?.fullname,
          studentEmail: firstResult.profiles?.email,
          regno: firstResult.profiles?.regno,
          department: firstResult.profiles?.department,
          level: firstResult.profiles?.level,
          semester: firstResult.profiles?.semester,
          results: courseResults,
          gpa: gpa,
          remarks: validGrades.length > 0 ? (parseFloat(gpa!) >= 3.5 ? "Excellent Performance" : parseFloat(gpa!) >= 2.5 ? "Good Performance" : "Fair Performance") : undefined,
          resultIds: studentPendingResults.map(r => r.id)
        },
      });

      if (functionError) throw functionError;

      // Update all results as sent
      const { error: updateError } = await supabase
        .from("results")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .in("id", studentPendingResults.map(r => r.id));

      if (updateError) throw updateError;

      toast({
        title: "Results sent successfully!",
        description: `All ${studentPendingResults.length} result(s) sent to ${studentName} in a single email`,
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Failed to send results",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingStudentId(null);
    }
  };

  const handleSendAll = async () => {
    const pendingResults = results.filter(r => r.status === "pending");
    
    if (pendingResults.length === 0) {
      toast({
        title: "No pending results",
        description: "All results have already been sent",
      });
      return;
    }

    setSendingAll(true);

    try {
      let successCount = 0;
      let failCount = 0;

      // Group results by student
      const resultsByStudent = pendingResults.reduce((acc, result) => {
        if (!acc[result.user_id]) {
          acc[result.user_id] = [];
        }
        acc[result.user_id].push(result);
        return acc;
      }, {} as Record<string, Result[]>);

      // Send one email per student with all their courses
      for (const [userId, studentResults] of Object.entries(resultsByStudent)) {
        try {
          const firstResult = studentResults[0];
          
          // Calculate GPA
          const gradePoints: { [key: string]: number } = {
            'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
          };
          
          const validGrades = studentResults.filter(r => r.grade && gradePoints[r.grade]);
          const gpa = validGrades.length > 0
            ? (validGrades.reduce((sum, r) => sum + (gradePoints[r.grade!] || 0), 0) / validGrades.length).toFixed(2)
            : undefined;

          // Prepare the combined results
          const courseResults = studentResults.map(r => ({
            courseCode: r.courses?.course_code || '',
            courseName: r.courses?.course_name || '',
            score: r.score,
            grade: r.grade || undefined
          }));

          const { error: functionError } = await supabase.functions.invoke("send-result-email", {
            body: {
              studentName: firstResult.profiles?.fullname,
              studentEmail: firstResult.profiles?.email,
              regno: firstResult.profiles?.regno,
              department: firstResult.profiles?.department,
              level: firstResult.profiles?.level,
              semester: firstResult.profiles?.semester,
              results: courseResults,
              gpa: gpa,
              remarks: validGrades.length > 0 ? (parseFloat(gpa!) >= 3.5 ? "Excellent Performance" : parseFloat(gpa!) >= 2.5 ? "Good Performance" : "Fair Performance") : undefined,
              resultIds: studentResults.map(r => r.id)
            },
          });

          if (functionError) throw functionError;

          const { error: updateError } = await supabase
            .from("results")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .in("id", studentResults.map(r => r.id));

          if (updateError) throw updateError;

          successCount++;
        } catch (error) {
          failCount++;
          await supabase
            .from("results")
            .update({ status: "failed" })
            .in("id", studentResults.map(r => r.id));
        }
      }

      toast({
        title: "Bulk send complete",
        description: `Successfully sent to ${successCount} student(s), Failed: ${failCount}`,
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Failed to send results",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("results").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Result deleted",
        description: "The result has been removed",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      sent: "default",
      failed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Group results by student
  const studentGroups = filteredResults.reduce((acc, result) => {
    const userId = result.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        student: result.profiles,
        results: [],
        hasPending: false,
      };
    }
    acc[userId].results.push(result);
    if (result.status === "pending") {
      acc[userId].hasPending = true;
    }
    return acc;
  }, {} as Record<string, { student: any; results: Result[]; hasPending: boolean }>);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, regno, course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={handleSendAll} 
          disabled={sendingAll || results.filter(r => r.status === "pending").length === 0}
        >
          {sendingAll ? (
            "Sending..."
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send All Pending
            </>
          )}
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Reg No</TableHead>
              <TableHead>Level/Semester</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(studentGroups).map(([userId, group], groupIndex) => (
                <>
                  {group.results.map((result, resultIndex) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">
                        {result.profiles?.fullname}
                        {resultIndex === 0 && group.hasPending && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-2 h-6 text-xs"
                            onClick={() => handleSendStudentResults(userId, result.profiles?.fullname || '')}
                            disabled={sendingStudentId === userId}
                          >
                            {sendingStudentId === userId ? (
                              "Sending all..."
                            ) : (
                              <>
                                <Mail className="h-3 w-3 mr-1" />
                                Send All
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>{result.profiles?.regno}</TableCell>
                      <TableCell>
                        {result.profiles?.level && result.profiles?.semester 
                          ? `${result.profiles.level}L / ${result.profiles.semester}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{result.courses?.course_code}</div>
                          <div className="text-sm text-muted-foreground">{result.courses?.course_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{result.score}</TableCell>
                      <TableCell>{result.grade || "-"}</TableCell>
                      <TableCell>{getStatusBadge(result.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendResult(result)}
                          disabled={result.status === "sent" || sendingId === result.id}
                        >
                          {sendingId === result.id ? (
                            "Sending..."
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(result.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
