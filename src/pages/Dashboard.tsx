import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import DashboardStats from "@/components/dashboard/DashboardStats";
import AddResultForm from "@/components/dashboard/AddResultForm";
import ResultsTable from "@/components/dashboard/ResultsTable";
import StudentsList from "@/components/dashboard/StudentsList";
import CourseManagement from "@/components/dashboard/CourseManagement";
import { LogOut, GraduationCap } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchResults();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/admin/login");
    }
  };

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from("results")
        .select(`
          *,
          profiles:profiles!results_user_id_fkey (fullname, regno, email),
          courses:courses!results_course_id_fkey (course_code, course_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setResults(data || []);
      
      const total = data?.length || 0;
      const sent = data?.filter(r => r.status === "sent").length || 0;
      const pending = data?.filter(r => r.status === "pending").length || 0;
      const failed = data?.filter(r => r.status === "failed").length || 0;

      setStats({ total, sent, pending, failed });
    } catch (error: any) {
      toast({
        title: "Failed to fetch results",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Results Dispatch System
              </h1>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <DashboardStats
          total={stats.total}
          sent={stats.sent}
          pending={stats.pending}
          failed={stats.failed}
        />

        <Tabs defaultValue="results" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="add-result">Add Result</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-2xl font-bold mb-6">All Results</h2>
              <ResultsTable results={results} onUpdate={fetchResults} />
            </div>
          </TabsContent>

          <TabsContent value="add-result">
            <AddResultForm onSuccess={fetchResults} />
          </TabsContent>

          <TabsContent value="students">
            <StudentsList />
          </TabsContent>

          <TabsContent value="courses">
            <CourseManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
