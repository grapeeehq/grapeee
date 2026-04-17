import Link from "next/link";

import { getServerSession } from "@/lib/session";

function Tessellation() {
  return (
    <svg
      className="lp-tess"
      viewBox="0 0 400 400"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="khatam" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <g stroke="currentColor" fill="none" strokeWidth="0.8">
            <rect x="10" y="10" width="60" height="60" />
            <rect x="10" y="10" width="60" height="60" transform="rotate(45 40 40)" />
            <circle cx="40" cy="40" r="28" />
            <line x1="40" y1="0" x2="40" y2="80" />
            <line x1="0" y1="40" x2="80" y2="40" />
          </g>
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#khatam)" />
    </svg>
  );
}

export default async function HomePage() {
  const session = await getServerSession();
  const signedIn = Boolean(session?.user);

  return (
    <main className="lp">
      <header className="lp-top">
        <div className="lp-top-inner">
          <Link href="/" className="lp-mark" aria-label="grapeee home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logolarge.svg" alt="grapeee" className="lp-mark-large" />
          </Link>
          <nav className="lp-nav">
            {signedIn ? (
              <Link href="/workspace" className="lp-nav-cta lp-nav-cta-solid">
                Workspace →
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="lp-nav-cta lp-nav-cta-ghost">
                  Log in
                </Link>
                <Link href="/sign-up" className="lp-nav-cta lp-nav-cta-solid">
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="lp-rule" />
      </header>

      <section className="lp-hero">
        <div className="lp-hero-bg">
          <Tessellation />
        </div>
        <div className="lp-hero-inner">
          <h1 className="lp-title">
            Built for <span className="lp-accent">Roblox</span> devs who build.
          </h1>
          <p className="lp-lede">
            A sharper copilot. Less ceremony, more game.
          </p>
          <div className="lp-cta">
            {signedIn ? (
              <Link href="/workspace" className="lp-btn lp-btn-solid">
                Open workspace
              </Link>
            ) : (
              <Link href="/sign-up" className="lp-btn lp-btn-solid">
                Create account
              </Link>
            )}
            <a
              className="lp-btn lp-btn-line"
              href="https://create.roblox.com/docs/studio/mcp"
            >
              Studio MCP docs
            </a>
          </div>
        </div>
      </section>

      <section className="lp-pillars">
        <div className="lp-pillars-inner">
          <article className="lp-pillar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="lp-pillar-glyph"><img src="/logosmall.svg" alt="" /></div>
            <div className="lp-pillar-num">I.</div>
            <h3>Ports into your workflow</h3>
            <p>
              Honors your Rojo config and Wally manifest. No migrations, no new opinions about
              your file tree. Point the companion at a directory, keep working.
            </p>
          </article>
          <article className="lp-pillar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="lp-pillar-glyph"><img src="/logosmall.svg" alt="" /></div>
            <div className="lp-pillar-num">II.</div>
            <h3>Grounded, not guessing</h3>
            <p>
              Retrieval is scoped to the project in front of you plus a focused Roblox doc pack.
              Drafts reference real APIs, not model folklore.
            </p>
          </article>
          <article className="lp-pillar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="lp-pillar-glyph"><img src="/logosmall.svg" alt="" /></div>
            <div className="lp-pillar-num">III.</div>
            <h3>Review before write</h3>
            <p>
              Every change surfaces as a patch you can read, edit, and apply deliberately. The
              browser does not own your disk. You do.
            </p>
          </article>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-foot-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logosmall.svg" alt="" className="lp-foot-glyph" />
          <span>grapeee</span>
        </div>
      </footer>

      <style>{`
        .lp {
          width: 100%;
          background: #ffffff;
          color: #0a0a0a;
          font-feature-settings: "ss01", "tnum";
        }

        .lp-top {
          background: #0a0a0a;
          color: #f5f5f0;
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: saturate(1.1);
        }
        .lp-top-inner {
          width: min(1280px, calc(100vw - 48px));
          margin: 0 auto;
          padding: 22px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .lp-mark {
          display: inline-flex;
          align-items: center;
          color: inherit;
        }
        .lp-mark-large {
          height: 26px;
          width: auto;
          display: block;
        }
        .lp-nav {
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }
        .lp-nav-cta {
          font-family: var(--font-mono), monospace;
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 10px 16px;
          transition: background 120ms ease, color 120ms ease;
        }
        .lp-nav-cta-ghost {
          color: #f5f5f0;
          border: 1px solid transparent;
        }
        .lp-nav-cta-ghost:hover {
          border-color: #3a3a3a;
        }
        .lp-nav-cta-solid {
          background: #f5f5f0;
          color: #0a0a0a;
          border: 1px solid #f5f5f0;
        }
        .lp-nav-cta-solid:hover {
          background: #B875B9;
          border-color: #B875B9;
        }
        .lp-rule {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0,
            #3a3a3a 10%,
            #B875B9 50%,
            #3a3a3a 90%,
            transparent 100%
          );
        }

        .lp-hero {
          position: relative;
          background: #0a0a0a;
          color: #f5f5f0;
          overflow: hidden;
          padding: 96px 0 112px;
          border-bottom: 1px solid #1a1a1a;
        }
        .lp-hero-bg {
          position: absolute;
          inset: 0;
          color: #1e1e1e;
          opacity: 0.9;
          pointer-events: none;
        }
        .lp-hero-bg .lp-tess {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          mask-image: radial-gradient(
            ellipse at 80% 40%,
            rgba(0,0,0,0.9) 0%,
            rgba(0,0,0,0.4) 45%,
            rgba(0,0,0,0) 75%
          );
          -webkit-mask-image: radial-gradient(
            ellipse at 80% 40%,
            rgba(0,0,0,0.9) 0%,
            rgba(0,0,0,0.4) 45%,
            rgba(0,0,0,0) 75%
          );
        }
        .lp-hero-inner {
          position: relative;
          width: min(1280px, calc(100vw - 48px));
          margin: 0 auto;
        }
        .lp-title {
          margin: 0;
          font-weight: 700;
          font-size: clamp(1.75rem, 3.6vw, 3rem);
          line-height: 1.08;
          letter-spacing: -0.03em;
          max-width: 26ch;
        }
        .lp-accent {
          color: #B875B9;
          font-style: italic;
          font-weight: 500;
        }
        .lp-lede {
          margin: 28px 0 0;
          max-width: 56ch;
          font-size: 1.05rem;
          line-height: 1.65;
          color: #c9c4bc;
        }
        .lp-cta {
          margin-top: 40px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .lp-btn {
          font-family: var(--font-mono), monospace;
          font-size: 0.82rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 16px 22px;
          display: inline-block;
        }
        .lp-btn-solid {
          background: #f5f5f0;
          color: #0a0a0a;
        }
        .lp-btn-line {
          border: 1px solid #f5f5f0;
          color: #f5f5f0;
        }

        .lp-pillars {
          background: #ffffff;
          color: #0a0a0a;
          padding: 96px 0;
        }
        .lp-pillars-inner {
          width: min(1280px, calc(100vw - 48px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0;
          border-top: 1px solid #0a0a0a;
          border-bottom: 1px solid #0a0a0a;
        }
        .lp-pillar {
          padding: 40px 32px 44px;
          border-right: 1px solid #0a0a0a;
          position: relative;
        }
        .lp-pillar:last-child {
          border-right: 0;
        }
        .lp-pillar-glyph {
          width: 44px;
          height: 44px;
          margin-bottom: 28px;
        }
        .lp-pillar-glyph img,
        .lp-pillar-glyph svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .lp-pillar-num {
          position: absolute;
          top: 28px;
          right: 32px;
          font-family: var(--font-mono), monospace;
          font-size: 0.78rem;
          letter-spacing: 0.14em;
          color: #822FB2;
        }
        .lp-pillar h3 {
          margin: 0 0 12px;
          font-weight: 700;
          font-size: 1.3rem;
          letter-spacing: -0.015em;
        }
        .lp-pillar p {
          margin: 0;
          color: #3a3a3a;
          line-height: 1.6;
          font-size: 0.98rem;
          max-width: 34ch;
        }

        .lp-foot {
          background: #0a0a0a;
          color: #9b93a8;
        }
        .lp-foot-inner {
          width: min(1280px, calc(100vw - 48px));
          margin: 0 auto;
          padding: 28px 0;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-mono), monospace;
          font-size: 0.76rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .lp-foot-glyph {
          width: 18px;
          height: 18px;
          color: #B875B9;
        }

        @media (max-width: 900px) {
          .lp-pillars-inner { grid-template-columns: 1fr; }
          .lp-pillar {
            border-right: 0;
            border-bottom: 1px solid #0a0a0a;
          }
          .lp-pillar:last-child { border-bottom: 0; }
        }
      `}</style>
    </main>
  );
}
