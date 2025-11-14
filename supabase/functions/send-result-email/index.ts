import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CourseResult {
  courseCode: string;
  courseName: string;
  score: string;
  grade?: string;
}

interface ResultEmailRequest {
  studentName: string;
  studentEmail: string;
  regno: string;
  department: string;
  level?: string;
  semester?: string;
  results: CourseResult[];
  gpa?: string;
  remarks?: string;
  resultIds: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      studentName, 
      studentEmail,
      regno,
      department,
      level,
      semester,
      results,
      gpa,
      remarks,
      resultIds 
    }: ResultEmailRequest = await req.json();

    console.log("Sending result email to:", studentEmail);

    // Generate the table rows for courses
    const courseRows = results.map(result => `
      <tr>
        <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${result.courseCode}</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">${result.courseName}</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #4F46E5;">${result.grade || '-'}</td>
      </tr>
    `).join('');

    const emailResponse = await resend.emails.send({
      from: "Results System <onboarding@resend.dev>",
      to: [studentEmail],
      subject: `Your Academic Results - ${semester ? semester + ' Semester' : 'Session'} ${level ? 'Level ' + level : ''}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px; }
              .container { max-width: 700px; margin: 0 auto; background: white; }
              .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
              .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
              .content { padding: 30px; }
              .greeting { font-size: 16px; margin-bottom: 20px; }
              .info-section { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .info-row { display: flex; padding: 8px 0; }
              .info-label { font-weight: 600; color: #6b7280; min-width: 180px; }
              .info-value { color: #111827; }
              .results-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
              .results-table th { background: #4F46E5; color: white; padding: 12px; text-align: center; font-weight: 600; }
              .results-table td { padding: 12px; border: 1px solid #e5e7eb; }
              .results-table tr:nth-child(even) { background: #f9fafb; }
              .gpa-section { background: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px 20px; margin: 20px 0; }
              .gpa-section strong { color: #4F46E5; font-size: 18px; }
              .remarks-section { background: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0; }
              .remarks-label { font-weight: 600; color: #6b7280; margin-bottom: 8px; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎓 Kaduna State Polytechnic</h1>
                <p>Automated Result Dispatching System</p>
              </div>
              <div class="content">
                <p class="greeting">Dear <strong>${studentName}</strong>,</p>
                <p>Your Academic Result For The(${semester || 'Current'} Semester,Session) Is As Follows:</p>
                
                <div class="info-section">
                  <div class="info-row">
                    <span class="info-label">Registration number:</span>
                    <span class="info-value">${regno}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Department:</span>
                    <span class="info-value">${department}</span>
                  </div>
                  ${level ? `
                  <div class="info-row">
                    <span class="info-label">Level:</span>
                    <span class="info-value">${level}</span>
                  </div>
                  ` : ''}
                </div>

                <table class="results-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Title</th>
                      <th>Grade Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${courseRows}
                  </tbody>
                </table>

                ${gpa ? `
                <div class="gpa-section">
                  <strong>GPA: ${gpa}</strong>
                </div>
                ` : ''}

                ${remarks ? `
                <div class="remarks-section">
                  <div class="remarks-label">REMARK:</div>
                  <p style="margin: 0; color: #111827;">${remarks}</p>
                </div>
                ` : ''}

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
