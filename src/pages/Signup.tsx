import SignupForm from "@/components/auth/SignupForm";
import { GraduationCap } from "lucide-react";

export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Results Dispatch System
          </h1>
          <p className="mt-2 text-muted-foreground">
            Automated result management and email delivery
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
