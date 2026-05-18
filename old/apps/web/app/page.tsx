import { Geist } from "next/font/google";
import Link from "next/link";

import { LandingIntroVideo } from "@/app/_components/landing-intro-video";
import { getServerSession } from "@/lib/session";

const editorial = Geist({
  subsets: ["latin"],
  variable: "--font-editorial",
});

const featureCards = [
  {
    title: "Start with an idea",
    body: "Describe what you want to build in plain language and get moving without a complicated setup.",
    className: "lp-card-wide",
  },
  {
    title: "Get help that stays practical",
    body: "Grapeee focuses on useful next steps, clean suggestions, and changes you can actually work with.",
    className: "lp-card-wide lp-card-dark",
  },
  {
    title: "See the plan",
    body: "You get a clear direction before anything big happens.",
    className: "lp-card-compact",
  },
  {
    title: "Review the change",
    body: "Suggestions stay visible, readable, and easy to approve.",
    className: "lp-card-compact lp-card-soft",
  },
  {
    title: "Keep control",
    body: "You stay in charge from first prompt to final ship.",
    className: "lp-card-compact",
  },
];

const helpCards = [
  {
    title: "Start with a prompt",
    body: "Describe the feature, fix, or idea in one sentence and get straight to the point.",
    tone: "warm",
  },
  {
    title: "Get something usable",
    body: "The response stays focused, readable, and easy to act on instead of turning into a wall of noise.",
    tone: "cool",
  },
  {
    title: "Stay in control",
    body: "You keep the final say while still moving faster than starting everything from scratch.",
    tone: "soft",
  },
];

const proofPhrases = [
  "Free for now",
  "Made for Roblox",
  "Clear suggestions",
  "Review first",
  "Open-source",
  "Built to help",
];

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
  const primaryHref = signedIn ? "/workspace" : "/sign-up";
  const primaryLabel = signedIn ? "Open workspace" : "Create account";

  return (
    <main className={`lp ${editorial.variable}`}>
      <header className="lp-top">
        <div className="lp-top-inner">
          <Link href="/" className="lp-mark" aria-label="grapeee home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logolarge.svg" alt="grapeee" className="lp-mark-large" />
          </Link>

          <nav className="lp-nav">
            <a href="#workflow" className="lp-nav-link">
              Workflow
            </a>
            <a href="#proof" className="lp-nav-link">
              Trust
            </a>
            {signedIn ? (
              <Link href="/workspace" className="lp-nav-cta lp-nav-cta-solid">
                Workspace
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
      </header>

      <section className="lp-hero">
        <div className="lp-hero-bg">
          <Tessellation />
        </div>

        <div className="lp-shell lp-hero-inner">
          <div className="lp-hero-copy">
            <p className="lp-kicker">AI help for Roblox creators</p>
            <h1 className="lp-title">
              Build Roblox games with less grind
              <span className="lp-inline-shot" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://picsum.photos/seed/grapeee-editorial/320/120"
                  alt=""
                />
              </span>
              and more momentum.
            </h1>
            <p className="lp-lede">
              Grapeee helps Roblox creators turn ideas into real progress with less friction.
            </p>
            <div className="lp-cta">
              <Link href={primaryHref} className="lp-btn lp-btn-solid">
                {primaryLabel}
              </Link>
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-stage">
              <LandingIntroVideo />
            </div>
          </div>
        </div>
      </section>

      <section className="lp-marquee" aria-label="Product signals">
        <div className="lp-marquee-track">
          {[...proofPhrases, ...proofPhrases].map((phrase, index) => (
            <span key={`${phrase}-${index}`} className="lp-marquee-item">
              {phrase}
            </span>
          ))}
        </div>
      </section>

      <section className="lp-chapter lp-chapter-light" id="workflow">
        <div className="lp-shell lp-section-head">
          <div>
            <p className="lp-section-kicker">Built for Roblox development</p>
            <h2>A simpler way to go from Roblox idea to playable progress.</h2>
          </div>
          <p className="lp-section-copy">
            Describe what you want to build, get a clear next step, and keep your game moving
            without getting buried in tool noise.
          </p>
        </div>

        <div className="lp-shell lp-feature-grid">
          {featureCards.map((card) => (
            <article key={card.title} className={`lp-feature-card ${card.className}`}>
              <div className="lp-feature-orb" aria-hidden="true" />
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-chapter lp-chapter-dark" id="proof">
        <div className="lp-shell">
          <div className="lp-proof-head">
            <div>
              <p className="lp-section-kicker lp-section-kicker-dark">How it helps</p>
              <h2>Three simple beats instead of one overwhelming experience.</h2>
            </div>
            <p className="lp-proof-intro">
              The flow should feel light from the first minute: ask for help, get a useful draft,
              decide what happens next.
            </p>
          </div>

          <div className="lp-help-grid">
            <article className="lp-help-panel lp-help-panel-feature">
              <p className="lp-help-label">What it feels like</p>
              <h3>
                Less guessing.
                <span className="lp-help-inline-shot" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://picsum.photos/seed/grapeee-help/240/120" alt="" />
                </span>
                More forward motion.
              </h3>
              <p className="lp-help-feature-copy">
                Grapeee is built to keep new users moving. You should understand the response fast
                and know what to do next without decoding product language first.
              </p>
              <div className="lp-help-pills">
                <span>Clear</span>
                <span>Fast</span>
                <span>Reviewable</span>
              </div>
            </article>

            <article className="lp-help-panel lp-help-panel-story">
              <p className="lp-help-label">The shape of the flow</p>
              <div className="lp-help-rail">
                <div className="lp-help-rail-step">
                  <span>01</span>
                  <strong>You ask</strong>
                </div>
                <div className="lp-help-rail-line" />
                <div className="lp-help-rail-step">
                  <span>02</span>
                  <strong>It drafts</strong>
                </div>
                <div className="lp-help-rail-line" />
                <div className="lp-help-rail-step">
                  <span>03</span>
                  <strong>You choose</strong>
                </div>
              </div>
            </article>

            {helpCards.map((card) => (
              <article
                key={card.title}
                className={`lp-help-card lp-help-card-${card.tone}`}
              >
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-chapter lp-chapter-cta">
        <div className="lp-shell lp-action">
          <div className="lp-action-copy">
            <p className="lp-section-kicker">Ready to try it</p>
            <h2>Start building with less friction.</h2>
            <p>
              Open the workspace, try a prompt, and see if the flow feels lighter from the first
              few minutes.
            </p>
          </div>
          <div className="lp-action-cta">
            <Link href={primaryHref} className="lp-btn lp-btn-dark">
              {primaryLabel}
            </Link>
            {!signedIn ? (
              <Link href="/sign-in" className="lp-btn lp-btn-quiet">
                Log in
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-shell lp-foot-inner">
          <div className="lp-foot-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logosmall.svg" alt="" className="lp-foot-glyph" />
            <span>grapeee</span>
          </div>
          <div className="lp-foot-links">
            <a href="#workflow">Workflow</a>
            <a href="#proof">Trust</a>
            <Link href={primaryHref}>{primaryLabel}</Link>
          </div>
        </div>
      </footer>

      <style>{`
        .lp {
          --lp-bg: #07111f;
          --lp-panel: rgba(255, 255, 255, 0.06);
          --lp-panel-strong: rgba(255, 255, 255, 0.1);
          --lp-ink: #f6efe7;
          --lp-muted: rgba(246, 239, 231, 0.72);
          --lp-dark: #09111b;
          --lp-line: rgba(255, 255, 255, 0.12);
          --lp-accent: #d7ab72;
          --lp-accent-soft: rgba(215, 171, 114, 0.18);
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          background:
            radial-gradient(circle at top left, rgba(191, 117, 185, 0.18), transparent 24%),
            radial-gradient(circle at 85% 20%, rgba(91, 151, 246, 0.18), transparent 22%),
            linear-gradient(180deg, #07111f 0%, #09131f 100%);
          color: var(--lp-ink);
          font-family: var(--font-editorial), var(--font-display), sans-serif;
          font-feature-settings: "ss01", "tnum";
        }

        .lp-shell {
          width: min(1320px, calc(100vw - 40px));
          margin: 0 auto;
        }

        .lp-top {
          position: sticky;
          top: 18px;
          z-index: 30;
          padding: 18px 0 0;
        }

        .lp-top-inner {
          width: min(1320px, calc(100vw - 40px));
          margin: 0 auto;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          background: rgba(7, 17, 31, 0.72);
          backdrop-filter: blur(22px) saturate(1.25);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
        }

        .lp-mark {
          display: inline-flex;
          align-items: center;
          color: inherit;
          flex: 0 0 auto;
        }

        .lp-mark-large {
          height: 28px;
          width: auto;
          display: block;
        }

        .lp-nav {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .lp-nav-link,
        .lp-nav-cta {
          font-family: var(--font-mono), monospace;
          font-size: 0.74rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          transition:
            color 180ms ease,
            border-color 180ms ease,
            background 180ms ease,
            transform 180ms ease;
        }

        .lp-nav-link {
          color: rgba(246, 239, 231, 0.76);
          padding: 10px 12px;
        }

        .lp-nav-link:hover {
          color: #ffffff;
        }

        .lp-nav-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 11px 16px;
          border: 1px solid transparent;
        }

        .lp-nav-cta-ghost {
          color: #f6efe7;
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.02);
        }

        .lp-nav-cta-ghost:hover {
          border-color: rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-1px);
        }

        .lp-nav-cta-solid {
          background: #f6efe7;
          color: #08111b;
          border-color: #f6efe7;
        }

        .lp-nav-cta-solid:hover {
          background: #d7ab72;
          border-color: #d7ab72;
          transform: translateY(-1px);
        }

        .lp-hero {
          position: relative;
          padding: 120px 0 84px;
          min-height: calc(100vh - 32px);
        }

        .lp-hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          color: rgba(255, 255, 255, 0.08);
          opacity: 0.9;
        }

        .lp-tess {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          mask-image: radial-gradient(circle at 68% 32%, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.34) 42%, rgba(0, 0, 0, 0) 72%);
          -webkit-mask-image: radial-gradient(circle at 68% 32%, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.34) 42%, rgba(0, 0, 0, 0) 72%);
        }

        .lp-hero-inner {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(460px, 0.92fr);
          gap: 54px;
          align-items: center;
        }

        .lp-hero-copy {
          max-width: 760px;
        }

        .lp-kicker,
        .lp-section-kicker {
          margin: 0 0 18px;
          font-family: var(--font-mono), monospace;
          font-size: 0.76rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(246, 239, 231, 0.7);
        }

        .lp-section-kicker {
          color: rgba(9, 17, 27, 0.58);
        }

        .lp-section-kicker-dark {
          color: rgba(246, 239, 231, 0.62);
        }

        .lp-title {
          margin: 0;
          max-width: 13.5ch;
          font-size: clamp(3.25rem, 7vw, 7rem);
          line-height: 0.94;
          letter-spacing: -0.065em;
          font-weight: 500;
          text-wrap: balance;
        }

        .lp-inline-shot {
          display: inline-flex;
          width: clamp(104px, 14vw, 164px);
          height: 0.9em;
          margin: 0 0.14em;
          vertical-align: -0.12em;
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.24);
        }

        .lp-inline-shot img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: grayscale(1) contrast(1.1) brightness(0.88);
        }

        .lp-lede {
          margin: 28px 0 0;
          max-width: 58ch;
          font-size: 1.1rem;
          line-height: 1.78;
          color: var(--lp-muted);
        }

        .lp-cta {
          margin-top: 40px;
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .lp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 56px;
          padding: 0 22px;
          border-radius: 999px;
          font-family: var(--font-mono), monospace;
          font-size: 0.76rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: 1px solid transparent;
          transition:
            transform 180ms ease,
            background 180ms ease,
            border-color 180ms ease,
            color 180ms ease;
        }

        .lp-btn:hover {
          transform: translateY(-2px);
        }

        .lp-btn-solid {
          background: #f6efe7;
          color: #08111b;
          border-color: #f6efe7;
        }

        .lp-btn-solid:hover {
          background: #d7ab72;
          border-color: #d7ab72;
        }

        .lp-btn-line {
          border-color: rgba(255, 255, 255, 0.14);
          color: #f6efe7;
          background: rgba(255, 255, 255, 0.03);
        }

        .lp-btn-line:hover {
          border-color: rgba(255, 255, 255, 0.26);
          background: rgba(255, 255, 255, 0.08);
        }

        .lp-btn-dark {
          background: #08111b;
          color: #f6efe7;
          border-color: #08111b;
        }

        .lp-btn-dark:hover {
          background: #182435;
          border-color: #182435;
        }

        .lp-btn-quiet {
          border-color: rgba(8, 17, 27, 0.16);
          color: #08111b;
          background: rgba(8, 17, 27, 0.04);
        }

        .lp-btn-quiet:hover {
          background: rgba(8, 17, 27, 0.08);
          border-color: rgba(8, 17, 27, 0.24);
        }

        .lp-hero-visual {
          position: relative;
        }

        .lp-stage {
          position: relative;
          padding: 22px;
          border-radius: 34px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
            rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 30px 120px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .lp-marquee {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);
        }

        .lp-marquee-track {
          width: max-content;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 18px 0;
          animation: lp-marquee 28s linear infinite;
        }

        .lp-marquee-item {
          display: inline-flex;
          align-items: center;
          gap: 18px;
          font-family: var(--font-mono), monospace;
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(246, 239, 231, 0.72);
          white-space: nowrap;
        }

        .lp-marquee-item::after {
          content: "";
          width: 34px;
          height: 1px;
          background: rgba(255, 255, 255, 0.22);
        }

        .lp-chapter {
          position: relative;
          padding: 140px 0;
        }

        .lp-chapter-light {
          color: #08111b;
          background:
            radial-gradient(circle at top left, rgba(215, 171, 114, 0.18), transparent 24%),
            linear-gradient(180deg, #f3ede4 0%, #eee4d7 100%);
        }

        .lp-chapter-dark {
          color: #f6efe7;
          background:
            radial-gradient(circle at top right, rgba(91, 151, 246, 0.12), transparent 20%),
            linear-gradient(180deg, #09111b 0%, #0b1420 100%);
        }

        .lp-chapter-cta {
          color: #08111b;
          background:
            radial-gradient(circle at 80% 20%, rgba(184, 117, 185, 0.12), transparent 18%),
            linear-gradient(180deg, #f3ede4 0%, #efe6db 100%);
        }

        .lp-section-head {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.8fr);
          gap: 40px;
          align-items: end;
          margin-bottom: 42px;
        }

        .lp-section-head h2,
        .lp-proof-copy h2,
        .lp-action-copy h2 {
          margin: 0;
          font-size: clamp(2.4rem, 5vw, 4.9rem);
          line-height: 0.96;
          letter-spacing: -0.06em;
          font-weight: 500;
          text-wrap: balance;
        }

        .lp-section-copy,
        .lp-proof-copy p,
        .lp-action-copy p {
          margin: 0;
          font-size: 1.02rem;
          line-height: 1.75;
          max-width: 54ch;
        }

        .lp-section-copy,
        .lp-action-copy p {
          color: rgba(8, 17, 27, 0.72);
        }

        .lp-proof-copy > p:last-of-type {
          color: rgba(246, 239, 231, 0.72);
          margin-top: 24px;
        }

        .lp-feature-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          grid-auto-flow: dense;
          gap: 18px;
        }

        .lp-feature-card {
          position: relative;
          min-height: 250px;
          padding: 28px;
          border-radius: 30px;
          overflow: hidden;
          border: 1px solid rgba(8, 17, 27, 0.08);
          background:
            radial-gradient(circle at top left, rgba(215, 171, 114, 0.18), transparent 34%),
            rgba(255, 255, 255, 0.68);
          box-shadow: 0 30px 80px rgba(8, 17, 27, 0.08);
          transition: transform 300ms ease, box-shadow 300ms ease;
        }

        .lp-feature-card:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 38px 100px rgba(8, 17, 27, 0.12);
        }

        .lp-card-dark {
          background:
            radial-gradient(circle at top left, rgba(215, 171, 114, 0.16), transparent 32%),
            linear-gradient(180deg, #0f1b2b 0%, #09111b 100%);
          color: #f6efe7;
          border-color: rgba(255, 255, 255, 0.08);
        }

        .lp-card-soft {
          background:
            radial-gradient(circle at top left, rgba(91, 151, 246, 0.18), transparent 30%),
            rgba(240, 234, 225, 0.98);
        }

        .lp-card-wide {
          grid-column: span 3;
        }

        .lp-card-compact {
          grid-column: span 2;
        }

        .lp-feature-orb {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.8), transparent 34%),
            linear-gradient(135deg, rgba(215, 171, 114, 0.9), rgba(184, 117, 185, 0.76));
          box-shadow: 0 18px 42px rgba(164, 116, 92, 0.24);
          margin-bottom: 76px;
        }

        .lp-feature-card h3,
        .lp-stack-card h3 {
          margin: 0;
          font-size: 1.48rem;
          line-height: 1.05;
          letter-spacing: -0.04em;
          font-weight: 500;
          text-wrap: balance;
        }

        .lp-feature-card p,
        .lp-stack-card p {
          margin: 14px 0 0;
          font-size: 0.98rem;
          line-height: 1.7;
          max-width: 34ch;
          color: inherit;
          opacity: 0.78;
        }

        .lp-proof-head {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.82fr);
          gap: 40px;
          align-items: end;
          margin-bottom: 42px;
        }

        .lp-proof-head h2 {
          margin: 0;
          font-size: clamp(2.5rem, 5vw, 5rem);
          line-height: 0.96;
          letter-spacing: -0.06em;
          font-weight: 500;
          text-wrap: balance;
          max-width: 12ch;
        }

        .lp-proof-intro {
          margin: 0;
          max-width: 46ch;
          font-size: 1.02rem;
          line-height: 1.75;
          color: rgba(246, 239, 231, 0.72);
        }

        .lp-help-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          grid-auto-flow: dense;
          gap: 18px;
        }

        .lp-help-panel,
        .lp-help-card {
          position: relative;
          overflow: hidden;
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.18);
        }

        .lp-help-panel {
          min-height: 280px;
          padding: 30px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03)),
            rgba(255, 255, 255, 0.04);
        }

        .lp-help-panel-feature {
          grid-column: span 3;
          background:
            radial-gradient(circle at top left, rgba(184, 117, 185, 0.18), transparent 32%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04)),
            rgba(255, 255, 255, 0.04);
        }

        .lp-help-panel-story {
          grid-column: span 3;
          display: grid;
          align-content: center;
          background:
            radial-gradient(circle at 82% 18%, rgba(91, 151, 246, 0.18), transparent 26%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03)),
            rgba(255, 255, 255, 0.03);
        }

        .lp-help-label {
          margin: 0 0 18px;
          font-family: var(--font-mono), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(246, 239, 231, 0.56);
        }

        .lp-help-panel h3,
        .lp-help-card h3 {
          margin: 0;
          font-size: clamp(1.6rem, 3vw, 3rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          font-weight: 500;
          text-wrap: balance;
        }

        .lp-help-inline-shot {
          display: inline-flex;
          width: clamp(88px, 10vw, 120px);
          height: 0.86em;
          margin: 0 0.16em;
          vertical-align: -0.1em;
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .lp-help-inline-shot img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: grayscale(1) contrast(1.15) brightness(0.82);
        }

        .lp-help-feature-copy {
          margin: 22px 0 0;
          max-width: 40ch;
          font-size: 1rem;
          line-height: 1.74;
          color: rgba(246, 239, 231, 0.78);
        }

        .lp-help-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 26px;
        }

        .lp-help-pills span {
          display: inline-flex;
          align-items: center;
          min-height: 38px;
          padding: 0 14px;
          border-radius: 999px;
          font-family: var(--font-mono), monospace;
          font-size: 0.7rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #f6efe7;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.09);
        }

        .lp-help-rail {
          display: grid;
          gap: 18px;
          margin-top: 12px;
        }

        .lp-help-rail-step {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .lp-help-rail-step span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          font-family: var(--font-mono), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          color: rgba(246, 239, 231, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          flex: 0 0 auto;
        }

        .lp-help-rail-step strong {
          flex: 1;
          font-size: 1.5rem;
          line-height: 1.05;
          letter-spacing: -0.04em;
          font-weight: 500;
          color: #f6efe7;
        }

        .lp-help-rail-line {
          height: 1px;
          margin-left: 64px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
        }

        .lp-help-card {
          grid-column: span 2;
          min-height: 210px;
          padding: 26px;
          transition: transform 280ms ease, box-shadow 280ms ease;
        }

        .lp-help-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 36px 100px rgba(0, 0, 0, 0.2);
        }

        .lp-help-card p {
          margin: 16px 0 0;
          max-width: 30ch;
          font-size: 0.98rem;
          line-height: 1.72;
          color: inherit;
          opacity: 0.78;
        }

        .lp-help-card-warm {
          background:
            radial-gradient(circle at top left, rgba(215, 171, 114, 0.2), transparent 30%),
            rgba(255, 255, 255, 0.06);
        }

        .lp-help-card-cool {
          background:
            radial-gradient(circle at top left, rgba(91, 151, 246, 0.18), transparent 30%),
            rgba(255, 255, 255, 0.04);
        }

        .lp-help-card-soft {
          background:
            radial-gradient(circle at top left, rgba(184, 117, 185, 0.18), transparent 30%),
            rgba(255, 255, 255, 0.05);
        }

        .lp-action {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 30px;
          padding: 42px 0 0;
          border-top: 1px solid rgba(8, 17, 27, 0.12);
        }

        .lp-action-copy {
          max-width: 760px;
        }

        .lp-action-copy p {
          margin-top: 24px;
        }

        .lp-action-cta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .lp-foot {
          background: #09111b;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .lp-foot-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 28px 0 36px;
        }

        .lp-foot-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-mono), monospace;
          font-size: 0.76rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(246, 239, 231, 0.68);
        }

        .lp-foot-glyph {
          width: 18px;
          height: 18px;
          display: block;
        }

        .lp-foot-links {
          display: inline-flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .lp-foot-links a {
          font-family: var(--font-mono), monospace;
          font-size: 0.74rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(246, 239, 231, 0.62);
        }

        .lp-foot-links a:hover {
          color: #ffffff;
        }

        @keyframes lp-marquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }

        @media (max-width: 1100px) {
          .lp-top {
            top: 12px;
          }

          .lp-hero-inner,
          .lp-section-head,
          .lp-action,
          .lp-proof-head {
            grid-template-columns: 1fr;
            display: grid;
          }

          .lp-hero {
            padding-top: 104px;
          }

          .lp-hero-visual {
            margin-top: 14px;
          }

          .lp-action-cta {
            justify-content: flex-start;
          }
        }

        @media (max-width: 900px) {
          .lp-feature-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .lp-help-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .lp-card-wide,
          .lp-card-compact,
          .lp-help-panel-feature,
          .lp-help-panel-story,
          .lp-help-card {
            grid-column: span 1;
          }

          .lp-foot-inner {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 720px) {
          .lp-shell,
          .lp-top-inner {
            width: min(1320px, calc(100vw - 24px));
          }

          .lp-top-inner {
            border-radius: 30px;
            padding: 16px;
          }

          .lp-nav {
            gap: 8px;
          }

          .lp-nav-link {
            display: none;
          }

          .lp-hero {
            min-height: auto;
            padding: 92px 0 64px;
          }

          .lp-title {
            max-width: 11.8ch;
            font-size: clamp(2.8rem, 14vw, 4.5rem);
          }

          .lp-chapter {
            padding: 96px 0;
          }

          .lp-feature-grid {
            grid-template-columns: 1fr;
          }

          .lp-feature-card,
          .lp-help-panel,
          .lp-help-card {
            padding: 24px;
            border-radius: 24px;
          }

          .lp-help-rail-step strong {
            font-size: 1.2rem;
          }

          .lp-btn {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
