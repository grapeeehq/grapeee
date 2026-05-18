import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

interface SendVerificationEmailMessageOptions {
  from: string;
  to: string;
  name?: string | null;
  url: string;
}

export async function sendVerificationEmailMessage({
  from,
  to,
  name,
  url,
}: SendVerificationEmailMessageOptions) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const safeName = name?.trim() ? escapeHtml(name.trim()) : "there";
  const safeUrl = escapeHtml(url);

  await resend.emails.send({
    from,
    to,
    subject: "Verify your Grapeee email",
    text: `Verify your email address to finish signing in to Grapeee: ${url}`,
    html: `
      <div style="font-family: Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
        <h1 style="font-size: 24px; line-height: 1.2; margin-bottom: 16px;">Verify your email</h1>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hi ${safeName},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Confirm this email address to finish signing in to Grapeee.
        </p>
        <p style="margin-bottom: 24px;">
          <a
            href="${safeUrl}"
            style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #111827; color: #ffffff; text-decoration: none; font-weight: 600;"
          >
            Verify email
          </a>
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
          If the button does not work, copy and paste this link into your browser:
        </p>
        <p style="font-size: 14px; line-height: 1.6; word-break: break-word; color: #4b5563;">
          ${safeUrl}
        </p>
      </div>
    `,
  });
}
