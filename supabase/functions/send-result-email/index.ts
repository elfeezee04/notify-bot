import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResultEmailRequest {
  studentName: string;
  studentEmail: string;
  subject: string;
  score: string;
  grade?: string;
  remarks?: string;
  resultId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      studentName, 
      studentEmail, 
      subject, 
      score, 
      grade, 
      remarks,
      resultId 
    }: ResultEmailRequest = await req.json();

    console.log("Sending result email to:", studentEmail);

    const emailResponse = await resend.emails.send({
      from: "Results System <onboarding@resend.dev>",
      to: [studentEmail],
      subject: `Your ${subject} Results`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .result-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .result-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .result-row:last-child { border-bottom: none; }
              .label { font-weight: 600; color: #6b7280; }
              .value { color: #111827; font-weight: 500; }
              .score-highlight { font-size: 24px; color: #4F46E5; font-weight: bold; text-align: center; padding: 15px; background: #EEF2FF; border-radius: 8px; margin: 15px 0; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎓 Your Results Are Here!</h1>
              </div>
              <div class="content">
                <p>Dear <strong>${studentName}</strong>,</p>
                <p>Your results for <strong>${subject}</strong> have been published. Here are your details:</p>
                
                <div class="result-card">
                  <div class="result-row">
                    <span class="label">Subject:</span>
                    <span class="value">${subject}</span>
                  </div>
                  <div class="result-row">
                    <span class="label">Student Name:</span>
                    <span class="value">${studentName}</span>
                  </div>
                  <div class="score-highlight">
                    Score: ${score}${grade ? ` (${grade})` : ''}
                  </div>
                  ${remarks ? `
                    <div style="margin-top: 15px; padding: 15px; background: #F3F4F6; border-radius: 6px;">
                      <span class="label">Remarks:</span>
                      <p style="margin: 5px 0 0 0;">${remarks}</p>
                    </div>
                  ` : ''}
                </div>

                <p style="margin-top: 25px;">Keep up the great work! If you have any questions about your results, please contact your instructor.</p>
                
                <div class="footer">
                  <p>This is an automated email from the Results Dispatching System.</p>
                  <p>Please do not reply to this email.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending result email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
