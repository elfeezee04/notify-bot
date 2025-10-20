import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, Shield } from "lucide-react";

export default function AdminLoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try to sign in
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If default admin and login failed, create the account
      if (authError && email === "admin@example.com" && password === "admin123") {
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (signupError) throw signupError;
        if (!signupData.user) throw new Error("Failed to create admin account");

        // Assign admin role via secure RPC (bypasses RLS)
        const { error: roleError } = await supabase.rpc('assign_admin_role', {
          target_user_id: signupData.user.id,
        });
        if (roleError) throw roleError;

        // Sign in again
        const { data: newAuthData, error: newAuthError } = await supabase.auth.signInWithPassword({ email, password });
        if (newAuthError) throw newAuthError;
        authData = newAuthData;
      } else if (authError) {
        throw authError;
      }

      if (!authData.user) throw new Error("Login failed");

      // Ensure admin role on default creds even if user existed already
      if (email === "admin@example.com" && password === "admin123") {
        const { error: ensureRoleError } = await supabase.rpc('assign_admin_role', {
          target_user_id: authData.user.id,
        });
        if (ensureRoleError) console.warn('assign_admin_role warning:', ensureRoleError);
      }

      // Verify admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (roleError) throw roleError;

      if (!roleData) {
        await supabase.auth.signOut();
        toast({ title: "Access Denied", description: "You do not have administrator privileges", variant: "destructive" });
        return;
      }

      toast({ title: "Welcome back!", description: "Successfully logged in as administrator" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-primary/20">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
        </div>
        <CardDescription>
          Administrator access only
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Login as Admin"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
