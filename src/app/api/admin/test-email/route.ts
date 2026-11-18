import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin authentication required." }, { status: 403 });
  }

  let body: { to?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const targetEmail = body.to?.trim() || user.email;

  const result = await sendEmail({
    to: targetEmail,
    subject: "উত্তরণ প্রকাশনী — Email Configuration Verification Test ✉️",
    text: "This is a test email sent from Uttoron Prokasoni to verify that your email provider (Resend/SMTP) is working properly.",
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #141413;">
        <h2 style="color: #d93829;">উত্তরণ প্রকাশনী • Email Service Test</h2>
        <p>Congratulations! Your email dispatcher is actively delivering emails.</p>
        <p><strong>Recipient:</strong> ${targetEmail}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      </div>
    `,
  });

  return NextResponse.json({
    diagnostics: {
      hasResendKey: Boolean(process.env.RESEND_API_KEY?.trim()),
      resendKeyPrefix: process.env.RESEND_API_KEY?.trim()?.slice(0, 5) || null,
      resendFrom: process.env.RESEND_FROM || "উত্তরণ প্রকাশনী <onboarding@resend.dev>",
      hasSmtpUser: Boolean(process.env.SMTP_USER?.trim()),
      smtpHost: process.env.SMTP_HOST || null,
    },
    result,
  });
}
