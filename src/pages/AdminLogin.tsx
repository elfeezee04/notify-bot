import { Link } from "react-router-dom";
import AdminLoginForm from "@/components/auth/AdminLoginForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md space-y-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <div className="text-center">
          <img src="/images/school-logo.png" alt="Kaduna State Polytechnic Logo" className="w-20 h-20 rounded-lg mb-4" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Administrator Portal
          </h1>
          <p className="mt-2 text-muted-foreground">
            Secure access for system administrators
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
