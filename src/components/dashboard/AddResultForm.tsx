import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";

interface AddResultFormProps {
  onSuccess: () => void;
}

export default function AddResultForm({ onSuccess }: AddResultFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: "",
    subject: "",
    score: "",
    grade: "",
    remarks: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to add results");
      }

      const { error } = await supabase.from("results").insert({
        student_name: formData.studentName,
        student_email: formData.studentEmail,
        subject: formData.subject,
        score: formData.score,
        grade: formData.grade || null,
        remarks: formData.remarks || null,
        status: "pending",
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Result added successfully!",
        description: "The result has been saved and is ready to be sent",
      });

      setFormData({
        studentName: "",
        studentEmail: "",
        subject: "",
        score: "",
        grade: "",
        remarks: "",
      });

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
          Enter student details and their result information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name *</Label>
              <Input
                id="studentName"
                placeholder="John Doe"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentEmail">Student Email *</Label>
              <Input
                id="studentEmail"
                type="email"
                placeholder="student@example.com"
                value={formData.studentEmail}
                onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Mathematics"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="score">Score *</Label>
              <Input
                id="score"
                placeholder="85/100"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                placeholder="A"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              placeholder="Excellent performance! Keep up the good work."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
