import { betterAuth } from "better-auth";
import { createEmailVerificationToken } from "better-auth/api";
import { toNextJsHandler } from "better-auth/next-js";
import { captcha } from "better-auth/plugins";
import { Pool } from "pg";

import { sendVerificationEmailMessage } from "./email";

const databaseUrl = process.env.DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleConfigured = Boolean(googleClientId && googleClientSecret);
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const authEmailFrom = process.env.AUTH_EMAIL_FROM;
const emailPasswordConfigured = Boolean(
  turnstileSiteKey && turnstileSecretKey && resendApiKey && authEmailFrom,
);

export const isAuthConfigured = Boolean(databaseUrl && secret);
export const isGoogleConfigured = googleConfigured;
export const isEmailPasswordConfigured = emailPasswordConfigured;

async function sendVerificationEmail({
  email,
  name,
  url,
}: {
  email: string;
  name?: string | null;
  url: string;
}) {
  await sendVerificationEmailMessage({
    from: authEmailFrom!,
    to: email,
    name,
    url,
  });
}

const pool = isAuthConfigured
  ? new Pool({
      connectionString: databaseUrl,
    })
  : null;

export const auth = isAuthConfigured && pool
  ? betterAuth({
      baseURL,
      secret,
      database: pool,
      emailAndPassword: {
        enabled: emailPasswordConfigured,
        requireEmailVerification: emailPasswordConfigured,
        async onExistingUserSignUp({ user }) {
          if (!emailPasswordConfigured || user.emailVerified) {
            return;
          }

          const token = await createEmailVerificationToken(secret!, user.email);
          const callbackURL = encodeURIComponent("/workspace");
          const url = `${baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`;

          await sendVerificationEmail({
            email: user.email,
            name: user.name,
            url,
          });
        },
      },
      emailVerification: emailPasswordConfigured
        ? {
            sendOnSignUp: true,
            sendOnSignIn: true,
            autoSignInAfterVerification: true,
            async sendVerificationEmail({ user, url }) {
              await sendVerificationEmail({
                email: user.email,
                name: user.name,
                url,
              });
            },
          }
        : undefined,
      plugins: emailPasswordConfigured
        ? [
            captcha({
              provider: "cloudflare-turnstile",
              secretKey: turnstileSecretKey!,
            }),
          ]
        : undefined,
      trustedOrigins: [baseURL],
      socialProviders: googleConfigured
        ? {
            google: {
              clientId: googleClientId!,
              clientSecret: googleClientSecret!,
            },
          }
        : undefined,
    })
  : null;

export const authHandlers = auth ? toNextJsHandler(auth) : null;
