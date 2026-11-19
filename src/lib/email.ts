import nodemailer from "nodemailer";
import type { Order } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  provider: "smtp" | "resend" | "dev_logger";
  mocked?: boolean;
  error?: string;
}

/**
 * Returns a configured Nodemailer transporter if SMTP environment variables are present.
 * Automatically cleans spaces from passwords (e.g. Google 16-char App Passwords)
 * and uses optimized Gmail preset when host is smtp.gmail.com.
 */
function getSmtpTransporter() {
  const user = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS?.trim();
  // Strip spaces from App Passwords (e.g. Gmail 16-char format "xxxx xxxx xxxx xxxx" -> "xxxxxxxxxxxxxxxx")
  const pass = rawPass?.replace(/\s+/g, "");
  const host =
    process.env.SMTP_HOST?.trim() ||
    (user?.endsWith("@gmail.com") ? "smtp.gmail.com" : undefined);
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!user || !pass) {
    return null;
  }

  // If host is smtp.gmail.com or user is @gmail.com, use nodemailer's optimized Gmail service
  const isGmail = host?.includes("gmail.com") || user.endsWith("@gmail.com");
  if (isGmail) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000,
    });
  }

  if (!host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 5000,
  });
}

function getSmtpSenderAddress(): string {
  const rawFrom = process.env.SMTP_FROM?.trim() || process.env.EMAIL_FROM?.trim();
  if (rawFrom) {
    // Strip accidental backslashes from quotes: \"Name\" -> "Name"
    return rawFrom.replace(/\\"/g, '"');
  }
  const user = process.env.SMTP_USER?.trim() || "uttoronprokasoni@gmail.com";
  return `"উত্তরণ প্রকাশনী" <${user}>`;
}

/**
 * Universal email dispatcher:
 * 1. Uses SMTP via Nodemailer if SMTP_USER and SMTP_PASS exist (User Preferred).
 * 2. Uses Resend REST API if RESEND_API_KEY exists.
 * 3. Falls back to structured console logging in dev/unconfigured environments.
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailOptions): Promise<EmailResult> {
  let lastError: string | undefined;

  // 1. Prioritize SMTP Transporter (Preferred: Direct Gmail / Custom SMTP)
  const transporter = getSmtpTransporter();
  if (transporter) {
    const smtpFrom = getSmtpSenderAddress();

    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        text,
        html,
      });
      console.info(`[Email Service: SMTP] Email successfully delivered to ${to} (MessageId: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
        provider: "smtp",
      };
    } catch (err) {
      lastError = err instanceof Error ? `SMTP: ${err.message}` : "SMTP error";
      console.error("[Email Service] SMTP delivery failed:", err);
    }
  }

  // 2. Try Resend REST API if SMTP not configured or failed and Resend key is present
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    const resendFrom =
      process.env.RESEND_FROM?.trim() ||
      process.env.EMAIL_FROM?.trim() ||
      "উত্তরণ প্রকাশনী <onboarding@resend.dev>";

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [to],
          subject,
          text,
          html,
        }),
      });

      const data = (await res.json()) as {
        id?: string;
        message?: string;
        error?: { message?: string };
      };

      if (res.ok && data.id) {
        console.info(`[Email Service: Resend] Email successfully delivered to ${to} (ID: ${data.id})`);
        return {
          success: true,
          messageId: data.id,
          provider: "resend",
        };
      }

      const errMsg =
        data.error?.message || data.message || `Resend HTTP ${res.status}`;
      lastError = `Resend Error: ${errMsg}`;
      console.warn(`[Email Service: Resend] Warning: ${errMsg}`);
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Resend request error";
      console.error("[Email Service] Resend API request failed:", err);
    }
  }

  // 3. Fallback: Structured Dev / Mock Logger
  // Guarantees account registration and order placement never crash when offline
  const fallbackFrom = getSmtpSenderAddress();

  console.info(
    `\n[Email Service: Mock Mode] ──────────────────────────────────────────\n` +
      `To: ${to}\n` +
      `From: ${fallbackFrom}\n` +
      `Subject: ${subject}\n` +
      `Note: Configure SMTP (SMTP_USER & SMTP_PASS in .env / Vercel) to deliver live emails.\n` +
      (lastError ? `Last Error: ${lastError}\n` : "") +
      `──────────────────────────────────────────────────────────────────\n`
  );

  return {
    success: true,
    provider: "dev_logger",
    mocked: true,
    error: lastError,
  };
}

/**
 * Generates an elegant, responsive HTML email matching the Minimaze Architectural Light Aesthetic.
 */
export function generateWelcomeEmailHtml(userName: string, siteUrl: string): string {
  const safeName = userName || "সম্মানিত পাঠক";
  const baseUrl = siteUrl.replace(/\/$/, "");

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>উত্তরণ প্রকাশনীতে আপনাকে স্বাগতম</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Bengali', Helvetica, Arial, sans-serif; color: #141413; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F6F5F0; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 6px; border: 1px solid #E5E3DC; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);">
          
          <!-- Top Architectural Accent Bar -->
          <tr>
            <td style="background-color: #D93829; height: 5px; line-height: 5px; font-size: 5px;">&nbsp;</td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding: 36px 40px 24px 40px; text-align: center; border-bottom: 1px solid #F0EEE6;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #D93829; font-weight: 700; margin-bottom: 8px;">
                      ARCHITECTURAL PUBLISHING HOUSE
                    </span>
                    <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 700; color: #141413; letter-spacing: -0.02em;">
                      উত্তরণ প্রকাশনী
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #7B786F;">
                      UTTORON PROKASONI
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome Body -->
          <tr>
            <td style="padding: 36px 40px;">
              <h2 style="margin: 0 0 16px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #141413; font-weight: 600;">
                স্বাগতম, ${safeName}!
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.7; color: #3E3D38;">
                উত্তরণ প্রকাশনীতে আপনার পাঠক অ্যাকাউন্টটি সফলভাবে সক্রিয় হয়েছে। রুচিশীল মনন, ইতিহাস, সাহিত্য, বিজ্ঞান ও চিন্তাশীলতার মেলবন্ধনে আমরা গড়ে তুলছি এক আধুনিক সাহিত্য আঙিনা। আমাদের সাথে যুক্ত হওয়ার জন্য আপনাকে আন্তরিক ধন্যবাদ।
              </p>

              <!-- Special Welcome Gift Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF9F5; border: 1px dashed #D93829; border-radius: 4px; margin: 28px 0; padding: 20px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #D93829; margin-bottom: 6px;">
                      READER'S PRIVILEGE • নতুন পাঠক উপহার
                    </div>
                    <div style="font-size: 16px; font-weight: 700; color: #141413; margin-bottom: 6px;">
                      আপনার প্রথম অর্ডারে ১০% বিশেষ ছাড়
                    </div>
                    <div style="font-size: 14px; color: #5C5A53; line-height: 1.5;">
                      চেকআউটের সময় নিচের প্রোমো কোডটি ব্যবহার করুন:
                    </div>
                    <div style="margin-top: 12px; display: inline-block; background-color: #141413; color: #FAF9F5; font-family: monospace; font-size: 16px; font-weight: 700; padding: 8px 18px; border-radius: 3px; letter-spacing: 0.15em;">
                      WELCOME10
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Highlights / Benefits Grid -->
              <h3 style="margin: 28px 0 16px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; color: #141413; border-bottom: 1px solid #F0EEE6; padding-bottom: 8px;">
                আপনার জন্য যা কিছু প্রস্তুত রয়েছে:
              </h3>
              
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 10px 0; vertical-align: top; width: 28px; font-size: 16px;">📚</td>
                  <td style="padding: 10px 0; font-size: 14px; line-height: 1.6; color: #3E3D38;">
                    <strong>সমৃদ্ধ বইসমগ্র:</strong> সমকালীন কথাসাহিত্য, ধ্রুপদী অনুবাদ, প্রবন্ধ ও গবেষণা গ্রন্থের নির্বাচিত সংগ্রহ।
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top; width: 28px; font-size: 16px;">🏛️</td>
                  <td style="padding: 10px 0; font-size: 14px; line-height: 1.6; color: #3E3D38;">
                    <strong>ইমারসিভ ৩ডি অভিজ্ঞতা:</strong> ইন্টারঅ্যাক্টিভ বইয়ের তাক ও প্রিভিউ দেখে পছন্দের বইটি বেছে নিন।
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; vertical-align: top; width: 28px; font-size: 16px;">🚚</td>
                  <td style="padding: 10px 0; font-size: 14px; line-height: 1.6; color: #3E3D38;">
                    <strong>দ্রুত ও সুরক্ষিত কুরিয়ার:</strong> ঢাকা ও ঢাকার বাইরে হোম ডেলিভারি, এবং ৳২,০০০+ অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি।
                  </td>
                </tr>
              </table>

              <!-- Call to Action Buttons -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0 16px 0; text-align: center;">
                <tr>
                  <td align="center">
                    <a href="${baseUrl}/books" target="_blank" style="display: inline-block; background-color: #141413; color: #F6F5F0; font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 3px; margin: 6px;">
                      বইসমগ্র ঘুরে দেখুন &rarr;
                    </a>
                    <a href="${baseUrl}/account" target="_blank" style="display: inline-block; background-color: #FAF9F5; color: #141413; border: 1px solid #D6D3C9; font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; padding: 13px 24px; border-radius: 3px; margin: 6px;">
                      আমার প্রোফাইল
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Colophon -->
          <tr>
            <td style="background-color: #FAF9F5; padding: 28px 40px; border-top: 1px solid #EFECE3; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #141413;">
                উত্তরণ প্রকাশনী — বই ও শিল্পের নান্দনিক মেলবন্ধন
              </p>
              <p style="margin: 0 0 14px 0; font-size: 12px; color: #78756D; line-height: 1.5;">
                যেকোনো প্রয়োজনে আমাদের ইমেইল করুন: <a href="mailto:contact@uttoronprokasoni.com" style="color: #D93829; text-decoration: none;">contact@uttoronprokasoni.com</a><br>
                ঢাকা, বাংলাদেশ
              </p>
              <p style="margin: 0; font-size: 11px; color: #9C988F;">
                &copy; ${new Date().getFullYear()} উত্তরণ প্রকাশনী. সর্বস্বত্ব সংরক্ষিত।
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Plain text fallback version of the welcome email.
 */
export function generateWelcomeEmailText(userName: string, siteUrl: string): string {
  const safeName = userName || "সম্মানিত পাঠক";
  const baseUrl = siteUrl.replace(/\/$/, "");

  return `উত্তরণ প্রকাশনী • UTTORON PROKASONI
ARCHITECTURAL PUBLISHING HOUSE
--------------------------------------------------

স্বাগতম, ${safeName}!

উত্তরণ প্রকাশনীতে আপনার পাঠক অ্যাকাউন্টটি সফলভাবে সক্রিয় হয়েছে। রুচিশীল মনন, ইতিহাস, সাহিত্য, বিজ্ঞান ও চিন্তাশীলতার মেলবন্ধনে আমরা গড়ে তুলছি এক আধুনিক সাহিত্য আঙিনা।

নতুন পাঠক উপহার (১০% ছাড়):
আপনার প্রথম অর্ডারে ১০% বিশেষ ছাড় উপভোগ করতে চেকআউটে ব্যবহার করুন কুপন কোড:
WELCOME10

বইসমগ্র ঘুরে দেখতে ভিজিট করুন:
${baseUrl}/books

আপনার অ্যাকাউন্ট ও অর্ডার ট্র্যাক করতে ভিজিট করুন:
${baseUrl}/account

--------------------------------------------------
উত্তরণ প্রকাশনী — বই ও শিল্পের নান্দনিক মেলবন্ধন
যোগাযোগ: contact@uttoronprokasoni.com
ঢাকা, বাংলাদেশ
`;
}

/**
 * High-level helper: Sends the welcome email asynchronously and safely.
 * Non-blocking: will never throw uncaught exceptions to caller.
 */
export async function sendWelcomeEmail({
  email,
  name,
  siteUrl,
}: {
  email: string;
  name: string;
  siteUrl?: string;
}): Promise<EmailResult> {
  const baseUrl =
    siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://uttoron-publication.vercel.app";

  const subject = `উত্তরণ প্রকাশনীতে স্বাগতম, ${name || "সম্মানিত পাঠক"}! 📚`;
  const html = generateWelcomeEmailHtml(name, baseUrl);
  const text = generateWelcomeEmailText(name, baseUrl);

  try {
    return await sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error(`[Email Service] Failed to send welcome email to ${email}:`, err);
    return {
      success: false,
      provider: "dev_logger",
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

/**
 * Generates an elegant, responsive HTML email for Order Confirmation.
 */
export function generateOrderConfirmationEmailHtml(order: Order, siteUrl: string): string {
  const baseUrl = siteUrl.replace(/\/$/, "");
  const customerName = order.customer.fullName || "সম্মানিত পাঠক";

  const paymentMethodLabel =
    order.paymentMethod === "COD"
      ? "ক্যাশ অন ডেলিভারি (Cash on Delivery)"
      : order.paymentMethod === "BKASH"
      ? "বিকাশ (bKash Verified)"
      : order.paymentMethod === "NAGAD"
      ? "নগদ (Nagad)"
      : "কার্ড / অনলাইন পেমেন্ট (Card / Online)";

  const paymentStatusHtml =
    order.paymentStatus === "PAID"
      ? `<span style="color: #15803d; font-weight: 700;">পরিশোধিত (PAID)</span>`
      : `<span style="color: #b45309; font-weight: 700;">পণ্য হাতে পেয়ে পরিশোধ (Cash on Delivery)</span>`;

  const orderDate = new Date(order.createdAt).toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemsRows = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #F0EEE6;">
        <td style="padding: 14px 10px; font-size: 14px; color: #141413;">
          <div style="font-weight: 600;">${item.title}</div>
          <div style="font-size: 12px; color: #78756D;">লেখক: ${item.authorName}</div>
        </td>
        <td align="center" style="padding: 14px 10px; font-size: 14px; color: #3E3D38;">
          ${item.quantity}
        </td>
        <td align="right" style="padding: 14px 10px; font-size: 14px; color: #3E3D38;">
          ${formatPrice(item.unitPrice)}
        </td>
        <td align="right" style="padding: 14px 10px; font-size: 14px; font-weight: 600; color: #141413;">
          ${formatPrice(item.lineTotal)}
        </td>
      </tr>`
    )
    .join("");

  const trackOrderUrl = `${baseUrl}/track?order=${encodeURIComponent(
    order.orderNumber
  )}&phone=${encodeURIComponent(order.customer.phone)}`;

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>অর্ডার নিশ্চিতকরণ — #${order.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Bengali', Helvetica, Arial, sans-serif; color: #141413; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F6F5F0; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 6px; border: 1px solid #E5E3DC; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);">
          
          <!-- Top Architectural Accent Bar -->
          <tr>
            <td style="background-color: #D93829; height: 5px; line-height: 5px; font-size: 5px;">&nbsp;</td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding: 36px 40px 24px 40px; text-align: center; border-bottom: 1px solid #F0EEE6;">
              <span style="display: inline-block; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #D93829; font-weight: 700; margin-bottom: 8px;">
                ORDER CONFIRMED • অর্ডার নিশ্চিত হয়েছে
              </span>
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 700; color: #141413; letter-spacing: -0.02em;">
                উত্তরণ প্রকাশনী
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; font-weight: 600; color: #5C5A53;">
                অর্ডার রেফারেন্স: <span style="font-family: monospace; color: #D93829; font-size: 15px;">#${order.orderNumber}</span>
              </p>
            </td>
          </tr>

          <!-- Order Greeting -->
          <tr>
            <td style="padding: 32px 40px 20px 40px;">
              <h2 style="margin: 0 0 12px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 19px; color: #141413; font-weight: 600;">
                শ্রদ্ধেয় ${customerName},
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: #3E3D38;">
                উত্তরণ প্রকাশনীতে আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে। আমাদের ঢাকা বাঁধাইখানা ও আর্কাইভ থেকে আপনার বইগুলো প্রস্তুত করে দ্রুততম সময়ে ডেলিভারি করা হবে।
              </p>

              <!-- Order Summary Meta Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF9F5; border: 1px solid #EBE8E0; border-radius: 4px; padding: 18px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #78756D; width: 40%;">অর্ডারের তারিখ:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #141413;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #78756D;">পেমেন্ট পদ্ধতি:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #141413;">${paymentMethodLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #78756D;">পেমেন্ট স্ট্যাটাস:</td>
                  <td style="padding: 6px 0; font-size: 13px;">${paymentStatusHtml}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #78756D; vertical-align: top;">ডেলিভারি ঠিকানা:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #141413; line-height: 1.5;">
                    ${order.customer.address}, ${order.customer.city} - ${order.customer.postalCode}<br>
                    <span style="font-weight: normal; color: #5C5A53;">যোগাযোগ: ${order.customer.phone}</span>
                  </td>
                </tr>
              </table>

              <!-- Order Items Table -->
              <h3 style="margin: 0 0 14px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; color: #141413; border-bottom: 1px solid #EBE8E0; padding-bottom: 8px;">
                অর্ডারকৃত বইসমূহ:
              </h3>
              
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #E5E3DC; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #78756D;">
                    <th align="left" style="padding: 8px 10px;">বইয়ের নাম</th>
                    <th align="center" style="padding: 8px 10px;">সংখ্যা</th>
                    <th align="right" style="padding: 8px 10px;">মূল্য</th>
                    <th align="right" style="padding: 8px 10px;">মোট</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Financial Breakdown -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px; margin-bottom: 28px; border-top: 1px solid #EBE8E0;">
                <tr>
                  <td style="padding: 8px 10px; font-size: 14px; color: #5C5A53;" align="right">উপমোট (Subtotal):</td>
                  <td style="padding: 8px 10px; font-size: 14px; font-weight: 600; color: #141413; width: 120px;" align="right">
                    ${formatPrice(order.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 10px; font-size: 14px; color: #5C5A53;" align="right">ডেলিভারি চার্জ:</td>
                  <td style="padding: 8px 10px; font-size: 14px; font-weight: 600; color: #141413;" align="right">
                    ${order.deliveryCharge === 0 ? "ফ্রি (৳০)" : formatPrice(order.deliveryCharge)}
                  </td>
                </tr>
                ${
                  order.discount > 0
                    ? `
                <tr>
                  <td style="padding: 8px 10px; font-size: 14px; color: #D93829;" align="right">
                    কুপন ছাড় (${order.couponCode || "Discount"}):
                  </td>
                  <td style="padding: 8px 10px; font-size: 14px; font-weight: 600; color: #D93829;" align="right">
                    -${formatPrice(order.discount)}
                  </td>
                </tr>`
                    : ""
                }
                <tr style="border-top: 2px solid #141413;">
                  <td style="padding: 12px 10px; font-size: 16px; font-weight: 700; color: #141413;" align="right">
                    সর্বমোট পরিশোধযোগ্য:
                  </td>
                  <td style="padding: 12px 10px; font-size: 18px; font-weight: 700; color: #D93829;" align="right">
                    ${formatPrice(order.total)}
                  </td>
                </tr>
              </table>

              <!-- Call to Action Track Order -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 16px 0; text-align: center;">
                <tr>
                  <td align="center">
                    <a href="${trackOrderUrl}" target="_blank" style="display: inline-block; background-color: #141413; color: #F6F5F0; font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 3px;">
                      অর্ডারের লাইভ স্ট্যাটাস দেখুন &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 16px 0 0 0; text-align: center; font-size: 12px; color: #78756D;">
                আনুমানিক ডেলিভারি সময়: ৩ থেকে ৫ কার্যদিবসের মধ্যে।
              </p>

            </td>
          </tr>

          <!-- Footer Colophon -->
          <tr>
            <td style="background-color: #FAF9F5; padding: 28px 40px; border-top: 1px solid #EFECE3; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #141413;">
                উত্তরণ প্রকাশনী — বই ও শিল্পের নান্দনিক মেলবন্ধন
              </p>
              <p style="margin: 0 0 14px 0; font-size: 12px; color: #78756D; line-height: 1.5;">
                অর্ডার সংক্রান্ত যেকোনো তথ্যের জন্য আমাদের ইমেইল করুন: <a href="mailto:contact@uttoronprokasoni.com" style="color: #D93829; text-decoration: none;">contact@uttoronprokasoni.com</a><br>
                ঢাকা, বাংলাদেশ
              </p>
              <p style="margin: 0; font-size: 11px; color: #9C988F;">
                &copy; ${new Date().getFullYear()} উত্তরণ প্রকাশনী. সর্বস্বত্ব সংরক্ষিত।
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Plain text fallback version of the Order Confirmation email.
 */
export function generateOrderConfirmationEmailText(order: Order, siteUrl: string): string {
  const baseUrl = siteUrl.replace(/\/$/, "");
  const customerName = order.customer.fullName || "সম্মানিত পাঠক";

  const itemsList = order.items
    .map(
      (item) =>
        `- ${item.title} (লেখক: ${item.authorName}) x ${item.quantity} = ${formatPrice(
          item.lineTotal
        )}`
    )
    .join("\n");

  const trackUrl = `${baseUrl}/track?order=${encodeURIComponent(
    order.orderNumber
  )}&phone=${encodeURIComponent(order.customer.phone)}`;

  return `উত্তরণ প্রকাশনী • UTTORON PROKASONI
অর্ডার নিশ্চিতকরণ — #${order.orderNumber}
--------------------------------------------------

শ্রদ্ধেয় ${customerName},

উত্তরণ প্রকাশনীতে আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে।

অর্ডারের বিবরণ:
- অর্ডার রেফারেন্স: #${order.orderNumber}
- তারিখ: ${new Date(order.createdAt).toLocaleDateString()}
- পেমেন্ট পদ্ধতি: ${order.paymentMethod} (${order.paymentStatus})
- ডেলিভারি ঠিকানা: ${order.customer.address}, ${order.customer.city}
- মোবাইল: ${order.customer.phone}

অর্ডারকৃত বইসমূহ:
${itemsList}

হিসাবের বিবরণ:
- উপমোট: ${formatPrice(order.subtotal)}
- ডেলিভারি চার্জ: ${order.deliveryCharge === 0 ? "ফ্রি (৳০)" : formatPrice(order.deliveryCharge)}
${order.discount > 0 ? `- কুপন ছাড়: -${formatPrice(order.discount)}\n` : ""}- সর্বমোট প্রদেয়: ${formatPrice(order.total)}

অর্ডার ট্র্যাক করার লিঙ্ক:
${trackUrl}

--------------------------------------------------
উত্তরণ প্রকাশনী — বই ও শিল্পের নান্দনিক মেলবন্ধন
যোগাযোগ: contact@uttoronprokasoni.com
ঢাকা, বাংলাদেশ
`;
}

/**
 * High-level helper: Sends the Order Confirmation email asynchronously and safely.
 * Non-blocking: will never throw uncaught exceptions to caller.
 */
export async function sendOrderConfirmationEmail({
  order,
  siteUrl,
}: {
  order: Order;
  siteUrl?: string;
}): Promise<EmailResult> {
  const baseUrl =
    siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://uttoron-publication.vercel.app";

  const subject = `অর্ডার নিশ্চিতকরণ — #${order.orderNumber} | উত্তরণ প্রকাশনী 📦`;
  const html = generateOrderConfirmationEmailHtml(order, baseUrl);
  const text = generateOrderConfirmationEmailText(order, baseUrl);

  try {
    return await sendEmail({
      to: order.customer.email,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error(
      `[Email Service] Failed to send order confirmation email to ${order.customer.email}:`,
      err
    );
    return {
      success: false,
      provider: "dev_logger",
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}
