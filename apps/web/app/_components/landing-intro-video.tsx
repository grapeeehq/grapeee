"use client";

import { Player } from "@remotion/player";

import {
  LANDING_INTRO_DURATION_IN_FRAMES,
  LANDING_INTRO_FPS,
  LANDING_INTRO_HEIGHT,
  LANDING_INTRO_WIDTH,
  LandingIntroComposition,
} from "@/app/_components/landing-intro-composition";

export function LandingIntroVideo() {
  return (
    <div className="lp-video-shell">
      <div className="lp-video-frame">
        <Player
          component={LandingIntroComposition}
          durationInFrames={LANDING_INTRO_DURATION_IN_FRAMES}
          compositionWidth={LANDING_INTRO_WIDTH}
          compositionHeight={LANDING_INTRO_HEIGHT}
          fps={LANDING_INTRO_FPS}
          autoPlay
          loop
          controls={false}
          clickToPlay={false}
          allowFullscreen={false}
          showVolumeControls={false}
          initiallyMuted
          acknowledgeRemotionLicense
          style={{
            width: "100%",
            aspectRatio: `${LANDING_INTRO_WIDTH} / ${LANDING_INTRO_HEIGHT}`,
          }}
        />
      </div>

      <style jsx>{`
        .lp-video-shell {
          position: relative;
        }

        .lp-video-frame {
          position: relative;
          border-radius: 28px;
          overflow: hidden;
          border: 1px solid rgba(245, 245, 240, 0.12);
          background:
            radial-gradient(circle at top left, rgba(184, 117, 185, 0.2), transparent 34%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          box-shadow:
            0 28px 80px rgba(0, 0, 0, 0.34),
            0 0 0 1px rgba(255, 255, 255, 0.02) inset;
        }

        .lp-video-frame :global(.remotion-player) {
          display: block;
        }
      `}</style>
    </div>
  );
}
