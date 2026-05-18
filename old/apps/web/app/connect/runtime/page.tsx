import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { getServerSession } from "@/lib/session";
import { authorizeRuntimePairing, getRuntimePairingForBrowser } from "@/lib/runtime-pairing";
import { normalizeInternalCallbackURL } from "@/lib/utils";

export const runtime = "nodejs";

function ConnectShell({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <p style={styles.eyebrow}>Managed runtime pairing</p>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.body}>{body}</p>
        {children}
      </section>
    </main>
  );
}

export default async function RuntimeConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ pairingId?: string }>;
}) {
  const { pairingId } = await searchParams;

  if (!pairingId) {
    return (
      <ConnectShell
        title="Missing pairing request"
        body="Open this page from the Grapeee daemon or Studio plugin so we know which local runtime you want to connect."
      />
    );
  }

  const pairing = getRuntimePairingForBrowser(pairingId);
  if (!pairing) {
    return (
      <ConnectShell
        title="This pairing request is no longer active"
        body="The authorization window may have expired. Start the connection flow again from your local Grapeee runtime."
      />
    );
  }

  const stablePairingId = pairing.pairingId;
  const callbackURL = normalizeInternalCallbackURL(`/connect/runtime?pairingId=${encodeURIComponent(stablePairingId)}`);
  const session = await getServerSession();

  async function authorizeAction() {
    "use server";

    const liveSession = await getServerSession();
    if (!liveSession?.user) {
      redirect(`/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`);
    }

    authorizeRuntimePairing(stablePairingId, {
      id: liveSession.user.id,
      name: liveSession.user.name || liveSession.user.email.split("@")[0],
      email: liveSession.user.email,
    });

    redirect(callbackURL);
  }

  if (!session?.user) {
    return (
      <ConnectShell
        title={`Connect ${pairing.deviceName}`}
        body={`Sign in to attach this ${pairing.hostKind === "studio-plugin" ? "Studio plugin" : "local daemon"} to your Grapeee account. Once you approve it here, the local runtime can finish connecting automatically.`}
      >
        <div style={styles.meta}>
          <div style={styles.metaRow}>
            <span>Device code</span>
            <strong>{pairing.code}</strong>
          </div>
          <div style={styles.metaRow}>
            <span>Expires</span>
            <strong>{new Date(pairing.expiresAt).toLocaleTimeString()}</strong>
          </div>
        </div>
        <div style={styles.actions}>
          <Link href={`/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`} style={styles.primaryButton}>
            Sign in to continue
          </Link>
          <Link href={`/sign-up?callbackURL=${encodeURIComponent(callbackURL)}`} style={styles.secondaryButton}>
            Create account
          </Link>
        </div>
      </ConnectShell>
    );
  }

  const isAuthorized = pairing.status === "authorized";

  return (
    <ConnectShell
      title={isAuthorized ? "Local runtime connected" : `Approve ${pairing.deviceName}`}
      body={isAuthorized
        ? `${pairing.deviceName} is now linked to ${session.user.email}. You can head back to the local runtime; it should finish the handshake on its own.`
        : `Approve this ${pairing.hostKind === "studio-plugin" ? "Studio plugin" : "local daemon"} to use your current Grapeee session. The daemon will receive a managed runtime token automatically after you confirm.`}
    >
      <div style={styles.meta}>
        <div style={styles.metaRow}>
          <span>Account</span>
          <strong>{session.user.email}</strong>
        </div>
        <div style={styles.metaRow}>
          <span>Device code</span>
          <strong>{pairing.code}</strong>
        </div>
      </div>

      {isAuthorized ? (
        <div style={styles.successBox}>
          <p style={styles.successTitle}>Approved</p>
          <p style={styles.successBody}>You can close this tab.</p>
        </div>
      ) : (
        <form action={authorizeAction} style={styles.actions}>
          <button type="submit" style={styles.primaryButton}>
            Approve and connect
          </button>
        </form>
      )}
    </ConnectShell>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "32px 20px",
    background:
      "radial-gradient(circle at top, rgba(240, 183, 83, 0.18), transparent 42%), linear-gradient(180deg, #0e1116 0%, #151a21 100%)",
    color: "#f5f1e8",
  },
  card: {
    width: "min(560px, 100%)",
    padding: "32px",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(20, 24, 31, 0.82)",
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.32)",
  },
  eyebrow: {
    margin: 0,
    fontSize: "0.74rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: "#f0b753",
  },
  title: {
    margin: "12px 0 10px",
    fontSize: "2rem",
    lineHeight: 1.05,
  },
  body: {
    margin: 0,
    color: "#c9c3b9",
    lineHeight: 1.65,
  },
  meta: {
    marginTop: "24px",
    padding: "18px 20px",
    borderRadius: "18px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    fontSize: "0.96rem",
    color: "#d7d1c8",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "12px",
    marginTop: "24px",
  },
  primaryButton: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "46px",
    padding: "0 18px",
    borderRadius: "999px",
    border: "none",
    background: "#f0b753",
    color: "#14181f",
    textDecoration: "none",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "46px",
    padding: "0 18px",
    borderRadius: "999px",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    color: "#f5f1e8",
    textDecoration: "none",
    fontWeight: 600,
  },
  successBox: {
    marginTop: "24px",
    padding: "18px 20px",
    borderRadius: "18px",
    border: "1px solid rgba(106, 201, 139, 0.3)",
    background: "rgba(106, 201, 139, 0.12)",
  },
  successTitle: {
    margin: 0,
    fontWeight: 700,
  },
  successBody: {
    margin: "8px 0 0",
    color: "#d7d1c8",
  },
} satisfies Record<string, CSSProperties>;
