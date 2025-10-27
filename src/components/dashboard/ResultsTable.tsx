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
    setSendingId(result.id);

    try {
      const { error: functionError } = await supabase.functions.invoke("send-result-email", {
        body: {
          studentName: result.profiles?.fullname,
          studentEmail: result.profiles?.email,
          subject: `${result.courses?.course_code} - ${result.courses?.course_name}`,
          score: result.score,
          grade: result.grade,
          remarks: result.remarks,
          resultId: result.id,
        },
      });

      if (functionError) throw functionError;

      const { error: updateError } = await supabase
        .from("results")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", result.id);

      if (updateError) throw updateError;

      toast({
        title: "Result sent successfully!",
        description: `Email sent to ${result.profiles?.email}`,
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
      let successCount = 0;
      let failCount = 0;

      for (const result of studentPendingResults) {
        try {
          const { error: functionError } = await supabase.functions.invoke("send-result-email", {
            body: {
              studentName: result.profiles?.fullname,
              studentEmail: result.profiles?.email,
              subject: `${result.courses?.course_code} - ${result.courses?.course_name}`,
              score: result.score,
              grade: result.grade,
              remarks: result.remarks,
              resultId: result.id,
            },
          });

          if (functionError) throw functionError;

          const { error: updateError } = await supabase
            .from("results")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", result.id);

          if (updateError) throw updateError;

          successCount++;
        } catch (error) {
          failCount++;
          await supabase
            .from("results")
            .update({ status: "failed" })
            .eq("id", result.id);
        }
      }

      toast({
        title: "Results sent",
        description: `Sent ${successCount} result(s) to ${studentName}${failCount > 0 ? `, ${failCount} failed` : ''}`,
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

      for (const result of pendingResults) {
        try {
          const { error: functionError } = await supabase.functions.invoke("send-result-email", {
            body: {
              studentName: result.profiles?.fullname,
              studentEmail: result.profiles?.email,
              subject: `${result.courses?.course_code} - ${result.courses?.course_name}`,
              score: result.score,
              grade: result.grade,
              remarks: result.remarks,
              resultId: result.id,
            },
          });

          if (functionError) throw functionError;

          const { error: updateError } = await supabase
            .from("results")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", result.id);

          if (updateError) throw updateError;

          successCount++;
        } catch (error) {
          failCount++;
          await supabase
            .from("results")
            .update({ status: "failed" })
            .eq("id", result.id);
        }
      }

      toast({
        title: "Bulk send complete",
        description: `Successfully sent: ${successCount}, Failed: ${failCount}`,
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
