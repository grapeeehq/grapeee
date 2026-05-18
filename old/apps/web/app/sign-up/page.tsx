import { redirect } from "next/navigation";

import { AuthForm } from "@/app/_components/auth-form";
import { isEmailPasswordConfigured, isGoogleConfigured } from "@/lib/auth";
import { getServerSession } from "@/lib/session";
import { normalizeInternalCallbackURL } from "@/lib/utils";

export const metadata = {
  title: "Create account · Grapeee",
};

function Tessellation() {
  return (
    <svg
      className="si-tess"
      viewBox="0 0 400 400"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="su-khatam" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <g stroke="currentColor" fill="none" strokeWidth="0.8">
            <rect x="10" y="10" width="60" height="60" />
            <rect x="10" y="10" width="60" height="60" transform="rotate(45 40 40)" />
            <circle cx="40" cy="40" r="28" />
            <line x1="40" y1="0" x2="40" y2="80" />
            <line x1="0" y1="40" x2="80" y2="40" />
          </g>
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#su-khatam)" />
    </svg>
  );
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  const { callbackURL } = await searchParams;
  const normalizedCallbackURL = normalizeInternalCallbackURL(callbackURL);
  const session = await getServerSession();
  if (session?.user) redirect(normalizedCallbackURL);

  return (
    <div className="si-wrap">
      <div className="si-bg" aria-hidden>
        <Tessellation />
      </div>
      <AuthForm
        mode="sign-up"
        googleEnabled={isGoogleConfigured}
        passwordEnabled={isEmailPasswordConfigured}
        callbackURL={normalizedCallbackURL}
      />

      <style>{`
        .si-wrap {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
        }
        .si-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          color: rgba(184, 117, 185, 0.22);
        }
        .si-tess {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          mask-image: radial-gradient(circle at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0) 75%);
          -webkit-mask-image: radial-gradient(circle at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0) 75%);
        }
      `}</style>
    </div>
  );
}
