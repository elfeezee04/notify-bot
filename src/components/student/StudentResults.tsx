import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, TrendingUp } from "lucide-react";

interface Result {
  id: string;
  score: string;
  grade: string;
  remarks: string;
  status: string;
  sent_at: string;
  courses: {
    course_code: string;
    course_name: string;
  };
}

export default function StudentResults() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("results")
        .select(`
          id,
          score,
          grade,
          remarks,
          status,
          sent_at,
          courses (
            course_code,
            course_name
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch results");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      sent: "default",
      pending: "secondary",
      failed: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getGradeBadge = (grade: string) => {
    const firstChar = grade.charAt(0).toUpperCase();
    const isGood = ["A", "B"].includes(firstChar);
    return (
      <Badge variant={isGood ? "default" : "secondary"} className="text-lg px-3 py-1">
        {grade}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading results...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          My Results
        </CardTitle>
        <CardDescription>
          View all your academic results
        </CardDescription>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No results available yet
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Your results will appear here once they are published
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{result.courses.course_code}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.courses.course_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{result.score}</TableCell>
                    <TableCell>{getGradeBadge(result.grade)}</TableCell>
                    <TableCell>{getStatusBadge(result.status)}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {result.remarks || "No remarks"}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
