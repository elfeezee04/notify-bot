import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Mail, Send, Shield, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    import("@/integrations/supabase/client").then(async ({ supabase }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check user role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (roleData?.role === "admin") {
          navigate("/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Results Dispatch System
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/signup")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-6 animate-pulse">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
              Automated Result Dispatching
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your result management and email delivery process. Send results automatically to students with beautiful, professional emails.
            </p>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-8">
              <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate("/signup")}>
                <GraduationCap className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="text-xl font-bold mb-2">Student Portal</h3>
                <p className="text-sm text-muted-foreground mb-4">Register to view your results</p>
                <Button className="w-full">Register as Student</Button>
              </div>
              <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate("/admin/login")}>
                <Shield className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="text-xl font-bold mb-2">Admin Portal</h3>
                <p className="text-sm text-muted-foreground mb-4">Manage and dispatch results</p>
                <Button variant="outline" className="w-full">Admin Login</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-xl p-8 border hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                <Send className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Bulk Email Sending</h3>
              <p className="text-muted-foreground">
                Send results to multiple students at once with a single click. Save time and effort.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 border hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Beautiful Templates</h3>
              <p className="text-muted-foreground">
                Professional email templates that make your results look great and maintain your brand.
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 border hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Reliable</h3>
              <p className="text-muted-foreground">
                Your data is encrypted and secure. Track delivery status and resend if needed.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <Zap className="w-16 h-16 mx-auto text-primary" />
            <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of educators who trust our system to deliver results efficiently.
            </p>
            <Button size="lg" onClick={() => navigate("/signup")} className="text-lg">
              Create Your Account
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Results Dispatch System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
