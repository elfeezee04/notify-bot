import SignupForm from "@/components/auth/SignupForm";


export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src="/images/school-logo.png" alt="Kaduna State Polytechnic Logo" className="w-20 h-20 rounded-lg mb-4" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Results Dispatch System
          </h1>
          <p className="mt-2 text-muted-foreground">
            Student Registration Portal
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
