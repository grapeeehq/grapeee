import { betterAuth } from "better-auth";
import { toNextJsHandler } from "better-auth/next-js";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleConfigured = Boolean(googleClientId && googleClientSecret);

export const isAuthConfigured = Boolean(databaseUrl && secret);
export const isGoogleConfigured = googleConfigured;

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
        enabled: true,
      },
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
