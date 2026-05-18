"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Turnstile, { type BoundTurnstileObject } from "react-turnstile";

import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

interface AuthFormProps {
  mode: Mode;
  googleEnabled: boolean;
  passwordEnabled: boolean;
  callbackURL?: string;
}

const defaultCallbackURL = "/workspace";

function getErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  return typeof error.code === "string" ? error.code : null;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null || !("message" in error)) {
    return fallback;
  }

  return typeof error.message === "string" ? error.message : fallback;
}

function isEmailNotVerifiedError(error: unknown) {
  const code = getErrorCode(error);
  const message = getErrorMessage(error, "");

  return code === "EMAIL_NOT_VERIFIED" || /email not verified/i.test(message);
}

export function AuthForm({
  mode,
  googleEnabled,
  passwordEnabled,
  callbackURL = defaultCallbackURL,
}: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [busy, setBusy] = useState<null | "email" | "google" | "resend">(null);
  const turnstileRef = useRef<BoundTurnstileObject | null>(null);

  const isSignUp = mode === "sign-up";
  const heading = isSignUp ? "Create your account" : "Welcome back";
  const sublede = isSignUp
    ? "One account, two paths in: keep building in Studio or in your editor."
    : "Sign in to pick up where you left off.";
  const submitLabel = isSignUp ? "Create account" : "Log in";
  const switchHref = isSignUp ? "/sign-in" : "/sign-up";
  const switchUrl = `${switchHref}?callbackURL=${encodeURIComponent(callbackURL)}`;
  const switchPrompt = isSignUp ? "Already have an account?" : "New here?";
  const switchCta = isSignUp ? "Log in" : "Create account";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const turnstileEnabled = passwordEnabled && turnstileSiteKey.length > 0;
  const showEmailForm = passwordEnabled && !(isSignUp && verificationEmail);

  function resetTurnstile() {
    setTurnstileToken("");
    turnstileRef.current?.reset();
  }

  async function handleResendVerification() {
    if (!verificationEmail) return;

    setError(null);
    setInfo(null);
    setBusy("resend");

    try {
      const result = await authClient.sendVerificationEmail({
        email: verificationEmail,
        callbackURL,
      });

      if (result.error) {
        setError(getErrorMessage(result.error, "We couldn't resend the verification email."));
        setBusy(null);
        return;
      }

      setInfo(`We sent a fresh verification link to ${verificationEmail}.`);
      setBusy(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't resend the verification email.");
      setBusy(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (turnstileEnabled && !turnstileToken) {
      setError("Complete the security check before continuing.");
      return;
    }

    setBusy("email");

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    const fetchOptions = turnstileEnabled
      ? {
          headers: {
            "x-captcha-response": turnstileToken,
          },
        }
      : undefined;

    try {
      const result = isSignUp
        ? await authClient.signUp.email({
            email: trimmedEmail,
            password,
            name: trimmedName || trimmedEmail.split("@")[0],
            callbackURL,
            fetchOptions,
          })
        : await authClient.signIn.email({
            email: trimmedEmail,
            password,
            callbackURL,
            fetchOptions,
          });

      if (result.error) {
        if (isEmailNotVerifiedError(result.error)) {
          setVerificationEmail(trimmedEmail);
          setInfo(`That email still needs verification. We sent a fresh link to ${trimmedEmail}.`);
        } else {
          setError(getErrorMessage(result.error, "Something went wrong."));
        }

        setBusy(null);
        resetTurnstile();
        return;
      }

      if (isSignUp) {
        setVerificationEmail(trimmedEmail);
        setPassword("");
        setInfo(`Check ${trimmedEmail} for a verification link to finish creating your account.`);
        setBusy(null);
        resetTurnstile();
        return;
      }

      router.push(callbackURL);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(null);
      resetTurnstile();
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy("google");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setBusy(null);
    }
  }

  return (
    <div className="auth-card">
      <header className="auth-head">
        <Link href="/" className="auth-back">← grapeee</Link>
        <h1>{heading}</h1>
        <p>{sublede}</p>
      </header>

      {googleEnabled ? (
        <button
          type="button"
          className="auth-google"
          onClick={handleGoogle}
          disabled={busy !== null}
        >
          <svg viewBox="0 0 18 18" aria-hidden width="18" height="18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A9 9 0 0 0 9 18Z" />
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A9 9 0 0 0 .957 4.961l3.007 2.332C4.672 5.166 6.656 3.58 9 3.58Z" />
          </svg>
          {busy === "google" ? "Opening Google…" : "Continue with Google"}
        </button>
      ) : null}

      {googleEnabled && showEmailForm ? <div className="auth-or"><span>or</span></div> : null}

      {showEmailForm ? (
        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp ? (
            <label className="auth-field">
              <span>Display name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                placeholder="What should we call you?"
              />
            </label>
          ) : null}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </label>

          {turnstileEnabled ? (
            <div className="auth-turnstile">
              <Turnstile
                sitekey={turnstileSiteKey}
                theme="dark"
                size="flexible"
                onVerify={(token, boundTurnstile) => {
                  turnstileRef.current = boundTurnstile;
                  setTurnstileToken(token);
                  setError(null);
                }}
                onExpire={() => {
                  setTurnstileToken("");
                }}
                onError={() => {
                  setTurnstileToken("");
                  setError("The security check failed. Please try again.");
                }}
              />
            </div>
          ) : null}

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="auth-submit" disabled={busy !== null}>
            {busy === "email" ? "Working…" : submitLabel}
          </button>
        </form>
      ) : null}

      {!passwordEnabled ? (
        <p className="auth-info">
          Email and password sign-in stays off until Cloudflare Turnstile and verification email
          delivery are configured.
        </p>
      ) : null}

      {info ? (
        <div className="auth-info">
          <p>{info}</p>
          {verificationEmail ? (
            <button
              type="button"
              className="auth-link-button"
              onClick={handleResendVerification}
              disabled={busy !== null}
            >
              {busy === "resend" ? "Sending…" : "Resend verification email"}
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="auth-switch">
        {switchPrompt}{" "}
        <Link href={switchUrl}>{switchCta}</Link>
      </p>

      <style>{`
        .auth-card {
          width: min(420px, 100%);
          margin: 64px auto;
          padding: 36px 32px;
          background: rgba(20, 24, 33, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(18px) saturate(1.2);
          -webkit-backdrop-filter: blur(18px) saturate(1.2);
          color: #f3efe7;
        }
        .auth-head {
          display: grid;
          gap: 8px;
          margin-bottom: 28px;
        }
        .auth-back {
          font-family: var(--font-mono), monospace;
          font-size: 0.74rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9b93a8;
          margin-bottom: 12px;
        }
        .auth-head h1 {
          margin: 0;
          font-size: 1.6rem;
          letter-spacing: -0.02em;
        }
        .auth-head p {
          margin: 0;
          color: #b6b0a6;
          line-height: 1.55;
          font-size: 0.96rem;
        }
        .auth-google {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px 16px;
          border-radius: 14px;
          border: 0;
          background: #f5f5f0;
          color: #0a0a0a;
          font-weight: 600;
          cursor: pointer;
          transition: background 120ms ease;
        }
        .auth-google:hover:not(:disabled) {
          background: #B875B9;
        }
        .auth-google:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .auth-or {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0;
          color: #9b93a8;
          font-size: 0.82rem;
        }
        .auth-or::before,
        .auth-or::after {
          content: "";
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
        }
        .auth-form {
          display: grid;
          gap: 14px;
        }
        .auth-field {
          display: grid;
          gap: 6px;
        }
        .auth-field span {
          font-size: 0.86rem;
          color: #b6b0a6;
        }
        .auth-field input {
          width: 100%;
          padding: 13px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(7, 10, 14, 0.6);
          color: #f3efe7;
        }
        .auth-field input:focus {
          outline: 2px solid #B875B9;
          outline-offset: 1px;
        }
        .auth-error {
          margin: 0;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(255, 123, 120, 0.1);
          border: 1px solid rgba(255, 123, 120, 0.3);
          color: #ff9e91;
          font-size: 0.9rem;
        }
        .auth-info {
          margin: 14px 0 0;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(245, 245, 240, 0.06);
          border: 1px solid rgba(245, 245, 240, 0.12);
          color: #dfd9cf;
          font-size: 0.92rem;
          line-height: 1.6;
        }
        .auth-info p {
          margin: 0;
        }
        .auth-link-button {
          margin-top: 12px;
          padding: 0;
          border: 0;
          background: transparent;
          color: #f5f5f0;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
        }
        .auth-link-button:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .auth-turnstile {
          display: grid;
          justify-items: center;
          overflow: hidden;
          border-radius: 14px;
        }
        .auth-submit {
          margin-top: 4px;
          padding: 14px 16px;
          border: 0;
          border-radius: 14px;
          background: #B875B9;
          color: #0a0a0a;
          font-weight: 700;
          cursor: pointer;
          transition: background 120ms ease, opacity 120ms ease;
        }
        .auth-submit:hover:not(:disabled) {
          background: #822FB2;
        }
        .auth-submit:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .auth-switch {
          margin: 22px 0 0;
          text-align: center;
          color: #9b93a8;
          font-size: 0.92rem;
        }
        .auth-switch a {
          color: #B875B9;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
