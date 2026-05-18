import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const LANDING_INTRO_WIDTH = 1280;
export const LANDING_INTRO_HEIGHT = 720;
export const LANDING_INTRO_FPS = 30;
export const LANDING_INTRO_DURATION_IN_FRAMES = 330;

const palette = {
  bg: "#090b12",
  text: "#f3eee7",
  muted: "rgba(243, 238, 231, 0.46)",
  purple: "#b875b9",
  purpleSoft: "rgba(184, 117, 185, 0.22)",
  purpleGlow: "rgba(184, 117, 185, 0.36)",
  green: "#82e0c5",
  red: "#f08f9a",
};

const promptText = "Scaffold a multi directional movement system";

type DiffLine = { kind: "ctx" | "add" | "del"; code: string };
type AgentFile = { name: string; lines: DiffLine[] };

const agentFiles: AgentFile[] = [
  {
    name: "MovementController.lua",
    lines: [
      { kind: "ctx", code: "local Movement = {}" },
      { kind: "ctx", code: "Movement.__index = Movement" },
      { kind: "ctx", code: "" },
      { kind: "del", code: "function Movement.new(speed)" },
      { kind: "add", code: "function Movement.new(config)" },
      { kind: "add", code: "  local self = setmetatable({}, Movement)" },
      { kind: "add", code: "  self.accel    = config.accel   or 120" },
      { kind: "add", code: "  self.damping  = config.damping or 0.88" },
      { kind: "add", code: "  self.velocity = Vector3.zero" },
      { kind: "add", code: "  return self" },
      { kind: "add", code: "end" },
      { kind: "ctx", code: "" },
      { kind: "del", code: "function Movement:move(dir)" },
      { kind: "add", code: "function Movement:move(vec3, dt)" },
      { kind: "del", code: "  self.pos += dir * self.speed" },
      { kind: "add", code: "  self.velocity += vec3 * self.accel * dt" },
      { kind: "add", code: "  self.velocity *= self.damping" },
      { kind: "add", code: "  self.pos      += self.velocity * dt" },
      { kind: "ctx", code: "  return self.pos" },
      { kind: "ctx", code: "end" },
    ],
  },
  {
    name: "InputMap.lua",
    lines: [
      { kind: "ctx", code: "local InputMap = {}" },
      { kind: "ctx", code: "" },
      { kind: "add", code: 'InputMap.bind("move_forward",  Enum.KeyCode.W)' },
      { kind: "add", code: 'InputMap.bind("move_back",     Enum.KeyCode.S)' },
      { kind: "add", code: 'InputMap.bind("move_left",     Enum.KeyCode.A)' },
      { kind: "add", code: 'InputMap.bind("move_right",    Enum.KeyCode.D)' },
      { kind: "add", code: 'InputMap.bind("dash",          Enum.KeyCode.LeftShift)' },
      { kind: "add", code: 'InputMap.bind("sprint",        Enum.KeyCode.LeftControl)' },
      { kind: "add", code: 'InputMap.bind("jump",          Enum.KeyCode.Space)' },
      { kind: "add", code: 'InputMap.bind("crouch",        Enum.KeyCode.C)' },
      { kind: "ctx", code: "" },
      { kind: "ctx", code: "return InputMap" },
    ],
  },
  {
    name: "CameraRig.lua",
    lines: [
      { kind: "ctx", code: "local CameraRig = {}" },
      { kind: "ctx", code: "" },
      { kind: "add", code: "function CameraRig:update(target, speed, dt)" },
      { kind: "del", code: "  cam.CFrame = target.CFrame" },
      { kind: "add", code: "  local goal = target.CFrame * self.offset" },
      { kind: "add", code: "  cam.CFrame = cam.CFrame:Lerp(goal, 0.22)" },
      { kind: "add", code: "  cam.FieldOfView = 70 + math.clamp(speed, 0, 60) * 0.12" },
      { kind: "add", code: "  self:applyShake(dt, speed)" },
      { kind: "ctx", code: "end" },
    ],
  },
  {
    name: "DashAbility.lua",
    lines: [
      { kind: "ctx", code: "local Dash = {}" },
      { kind: "ctx", code: "Dash.__index = Dash" },
      { kind: "ctx", code: "" },
      { kind: "add", code: "function Dash:activate(char, vec3)" },
      { kind: "add", code: "  if not self.ready then return end" },
      { kind: "add", code: "  self.ready = false" },
      { kind: "add", code: "  char.Movement:impulse(vec3 * self.power)" },
      { kind: "add", code: "  char.FX:play(\"dash_trail\")" },
      { kind: "add", code: "  task.wait(self.cooldown)" },
      { kind: "add", code: "  self.ready = true" },
      { kind: "add", code: "end" },
    ],
  },
  {
    name: "CharacterAnim.lua",
    lines: [
      { kind: "add", code: "local anims = {" },
      { kind: "add", code: "  dash   = Anim.load(\"dash_forward\")," },
      { kind: "add", code: "  sprint = Anim.load(\"sprint_cycle\")," },
      { kind: "add", code: "  slide  = Anim.load(\"slide_low\")," },
      { kind: "add", code: "}" },
      { kind: "add", code: "anims.dash.Priority   = Enum.AnimationPriority.Action" },
      { kind: "add", code: "anims.sprint.Priority = Enum.AnimationPriority.Movement" },
      { kind: "add", code: "anims.dash:AdjustSpeed(1.4)" },
    ],
  },
  {
    name: "NetworkSync.lua",
    lines: [
      { kind: "ctx", code: "local RemoteEvent = ReplicatedStorage.MoveSync" },
      { kind: "ctx", code: "" },
      { kind: "add", code: "RemoteEvent.OnServerEvent:Connect(function(plr, vec3)" },
      { kind: "add", code: "  if not validate(plr, vec3) then return end" },
      { kind: "add", code: "  replicate(plr, vec3)" },
      { kind: "add", code: "  metrics:record(\"move\", plr.UserId)" },
      { kind: "add", code: "end)" },
    ],
  },
  {
    name: "PlayerController.lua",
    lines: [
      { kind: "del", code: "self.speed   = 16" },
      { kind: "add", code: "self.accel   = 120" },
      { kind: "add", code: "self.damping = 0.88" },
      { kind: "add", code: "self.dash    = Dash.new({ power = 48, cooldown = 0.8 })" },
      { kind: "add", code: "self.camera  = CameraRig.new(self)" },
      { kind: "add", code: "self.input   = InputMap.subscribe(self)" },
      { kind: "ctx", code: "" },
      { kind: "add", code: "function PlayerController:tick(dt)" },
      { kind: "add", code: "  local vec = self.input:readVector()" },
      { kind: "add", code: "  self.movement:move(vec, dt)" },
      { kind: "add", code: "  self.camera:update(self.char, self.movement.speed, dt)" },
      { kind: "add", code: "end" },
    ],
  },
  {
    name: "MovementTests.lua",
    lines: [
      { kind: "add", code: "it(\"dashes along vec3\", function()" },
      { kind: "add", code: "  local m = Movement.new({ accel = 120 })" },
      { kind: "add", code: "  m:impulse(Vector3.new(48, 0, 0))" },
      { kind: "add", code: "  m:move(Vector3.zero, 1/60)" },
      { kind: "add", code: "  expect(m.velocity.X).toBeCloseTo(42, 1)" },
      { kind: "add", code: "end)" },
    ],
  },
  {
    name: "WorldStreamer.lua",
    lines: [
      { kind: "add", code: "streamer:setRadius(512)" },
      { kind: "add", code: "streamer:onEnter(chunk, function(c)" },
      { kind: "add", code: "  workspace.Chunks:add(c, loadChunk(c.id))" },
      { kind: "add", code: "end)" },
      { kind: "add", code: "streamer:onExit(chunk, function(c)" },
      { kind: "add", code: "  unloadChunk(c.id)" },
      { kind: "add", code: "end)" },
    ],
  },
  {
    name: "UIHud.lua",
    lines: [
      { kind: "add", code: "Hud.StaminaBar:bind(player.Stamina)" },
      { kind: "add", code: "Hud.DashReady:bind(player.Dash.ready)" },
      { kind: "add", code: "Hud.Speedometer:bind(player.Movement.velocity)" },
      { kind: "add", code: "Hud.Minimap:bind(workspace.Chunks)" },
    ],
  },
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const between = (frame: number, start: number, end: number) =>
  clamp01(interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));

const fadeWindow = (frame: number, start: number, inEnd: number, outStart: number, end: number) =>
  clamp01(
    Math.min(
      between(frame, start, inEnd),
      interpolate(frame, [outStart, end], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
  );

function TessellationPattern() {
  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        color: "rgba(255,255,255,0.08)",
      }}
    >
      <defs>
        <pattern id="landing-intro-khatam" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <g stroke="currentColor" fill="none" strokeWidth="0.8">
            <rect x="10" y="10" width="60" height="60" />
            <rect x="10" y="10" width="60" height="60" transform="rotate(45 40 40)" />
            <circle cx="40" cy="40" r="28" />
            <line x1="40" y1="0" x2="40" y2="80" />
            <line x1="0" y1="40" x2="80" y2="40" />
          </g>
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#landing-intro-khatam)" />
    </svg>
  );
}

function Background() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = frame / durationInFrames;

  return (
    <>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% -10%, rgba(184,117,185,0.16), transparent 38%), linear-gradient(180deg, #070910 0%, #090b12 48%, #06070d 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.52,
          transform: `scale(1.08) translate(${Math.sin(drift * Math.PI * 2) * 12}px, ${Math.cos(
            drift * Math.PI * 1.4,
          ) * 10}px)`,
        }}
      >
        <TessellationPattern />
      </div>
      <div
        style={{
          position: "absolute",
          inset: "-18% auto auto -8%",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: palette.purpleGlow,
          filter: "blur(120px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -120,
          bottom: -180,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "rgba(125, 96, 180, 0.18)",
          filter: "blur(140px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0.08) 22%, rgba(0,0,0,0.28) 100%)",
        }}
      />
    </>
  );
}

function PromptScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sceneOpacity = fadeWindow(frame, 0, 24, 104, 132);
  const lift = spring({
    frame,
    fps,
    config: {
      damping: 14,
      stiffness: 120,
      mass: 0.85,
    },
  });

  const titleReveal = between(frame, 8, 34);
  const boxReveal = between(frame, 18, 48);
  const typedCount = Math.floor(interpolate(frame, [42, 98], [0, promptText.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  }));
  const typed = promptText.slice(0, typedCount);
  const cursorVisible = Math.floor(frame / 9) % 2 === 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: sceneOpacity,
        filter: `blur(${interpolate(sceneOpacity, [0, 1], [22, 0])}px)`,
        transform: `scale(${interpolate(lift, [0, 1], [0.96, 1])}) translateY(${interpolate(
          lift,
          [0, 1],
          [26, 0],
        )}px)`,
      }}
    >
      <div
        style={{
          width: 980,
          maxWidth: "90%",
          display: "grid",
          justifyItems: "center",
          gap: 34,
        }}
      >
        <div
          style={{
            opacity: titleReveal,
            transform: `translateY(${interpolate(titleReveal, [0, 1], [18, 0])}px)`,
            color: palette.text,
            fontSize: 84,
            lineHeight: 0.95,
            letterSpacing: "-0.07em",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          What are we building?
        </div>

        <div
          style={{
            width: "100%",
            minHeight: 118,
            borderRadius: 30,
            border: `3px solid rgba(184, 117, 185, 0.88)`,
            background: "rgba(4, 6, 10, 0.88)",
            boxShadow: `0 0 0 4px ${palette.purpleSoft}, 0 26px 80px rgba(0,0,0,0.4)`,
            padding: "18px 22px 18px 34px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            opacity: boxReveal,
            transform: `translateY(${interpolate(boxReveal, [0, 1], [24, 0])}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 2,
                height: 46,
                background: palette.text,
                opacity: 0.95,
              }}
            />
            <div
              style={{
                minWidth: 0,
                color: typedCount === 0 ? "rgba(243, 238, 231, 0.58)" : palette.text,
                fontSize: 28,
                lineHeight: 1.25,
                letterSpacing: "-0.04em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {typedCount === 0 ? "Describe your game, or @-mention one for context..." : typed}
              <span style={{ opacity: cursorVisible ? 1 : 0, color: palette.purple }}> |</span>
            </div>
          </div>

          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(184, 117, 185, 0.44)",
              display: "grid",
              placeItems: "center",
              color: palette.bg,
              fontSize: 42,
              fontWeight: 700,
              boxShadow: "0 12px 30px rgba(184, 117, 185, 0.25)",
            }}
          >
            ↑
          </div>
        </div>
      </div>
    </div>
  );
}

function FileCard({
  file,
  visibleLines,
  activeLine,
  cursorOn,
}: {
  file: AgentFile;
  visibleLines?: number;
  activeLine?: number;
  cursorOn?: boolean;
}) {
  const count = visibleLines ?? file.lines.length;
  return (
    <div
      style={{
        width: 840,
        borderRadius: 16,
        border: "1px solid rgba(184,117,185,0.24)",
        background: "rgba(6, 8, 14, 0.94)",
        boxShadow:
          "0 0 0 1px rgba(184,117,185,0.10), 0 22px 60px rgba(0,0,0,0.42)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: palette.purple,
            boxShadow: `0 0 10px ${palette.purple}`,
          }}
        />
        <div
          style={{
            color: palette.text,
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 13,
            letterSpacing: "0.02em",
          }}
        >
          {file.name}
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            color: palette.muted,
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 9,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
          }}
        >
          editing
        </div>
      </div>

      <div style={{ padding: "10px 0" }}>
        {file.lines.slice(0, count).map((line, i) => {
          const bg =
            line.kind === "add"
              ? "rgba(130, 224, 197, 0.10)"
              : line.kind === "del"
              ? "rgba(240, 143, 154, 0.10)"
              : "transparent";
          const sign =
            line.kind === "add" ? "+" : line.kind === "del" ? "-" : " ";
          const signColor =
            line.kind === "add"
              ? palette.green
              : line.kind === "del"
              ? palette.red
              : palette.muted;
          const isActive = activeLine === i;
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "54px 24px 1fr",
                alignItems: "center",
                padding: "2px 22px",
                background: bg,
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 16,
                lineHeight: 1.55,
              }}
            >
              <span
                style={{
                  color: palette.muted,
                  textAlign: "right",
                  paddingRight: 14,
                  opacity: 0.55,
                }}
              >
                {i + 1}
              </span>
              <span style={{ color: signColor, fontWeight: 700 }}>{sign}</span>
              <span
                style={{
                  color: palette.text,
                  whiteSpace: "pre",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {line.code}
                {isActive && cursorOn ? (
                  <span style={{ color: palette.purple }}>▍</span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DiffBurstScene() {
  const frame = useCurrentFrame();
  const sceneOpacity = fadeWindow(frame, 112, 130, 198, 222);
  const cursorOn = Math.floor(frame / 4) % 2 === 0;

  const cardGap = 32;
  const lineHeight = 24.8;
  const headerHeight = 42;
  const cardPadding = 20;
  const cardHeights = agentFiles.map(
    (f) => headerHeight + cardPadding + f.lines.length * lineHeight,
  );
  const totalHeight =
    cardHeights.reduce((a, b) => a + b, 0) + cardGap * (agentFiles.length - 1);

  const streamStart = 116;
  const streamPerLine = 1.5;
  const firstFileLines = agentFiles[0].lines.length;
  const streamDuration = firstFileLines * streamPerLine;
  const streamEnd = streamStart + streamDuration;

  const streamProgress = between(frame, streamStart, streamEnd);
  const visibleFirstLines = Math.min(
    firstFileLines,
    Math.floor(streamProgress * firstFileLines + 0.001),
  );
  const activeFirstLine = Math.min(firstFileLines - 1, visibleFirstLines);

  const scrollStart = streamEnd - 4;
  const scrollEnd = 206;
  const scrollProgress = between(frame, scrollStart, scrollEnd);
  const eased = Easing.bezier(0.55, 0, 0.85, 0.55)(scrollProgress);
  const overshoot = 160;
  const maxScroll = totalHeight + overshoot - 200;
  const scrollY = eased * maxScroll;

  const speedBlur = interpolate(
    scrollProgress,
    [0, 0.35, 0.75, 1],
    [0, 1, 10, 26],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const exitBlur = interpolate(frame, [198, 222], [0, 24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const totalBlur = Math.max(speedBlur, exitBlur);

  const panelOpacity = between(frame, 112, 128);
  const panelLift = interpolate(panelOpacity, [0, 1], [36, 0]);

  const filesEdited = Math.min(
    agentFiles.length,
    1 +
      (streamProgress >= 1 ? 1 : 0) +
      Math.floor(scrollProgress * (agentFiles.length - 1) * 1.15),
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: sceneOpacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          maskImage:
            "linear-gradient(180deg, transparent 0%, #000 12%, #000 88%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, #000 12%, #000 88%, transparent 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 80,
            transform: `translateX(-50%) translateY(${panelLift - scrollY}px)`,
            opacity: panelOpacity,
            filter: `blur(${totalBlur}px)`,
            display: "flex",
            flexDirection: "column",
            gap: cardGap,
          }}
        >
          {agentFiles.map((file, idx) => (
            <FileCard
              key={file.name}
              file={file}
              visibleLines={idx === 0 ? visibleFirstLines : file.lines.length}
              activeLine={idx === 0 ? activeFirstLine : undefined}
              cursorOn={cursorOn}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 40,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(
            frame,
            [118, 134, 196, 214],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 20px",
            borderRadius: 999,
            border: "1px solid rgba(184,117,185,0.32)",
            background: "rgba(6, 8, 14, 0.82)",
            color: palette.text,
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 12,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: palette.green,
              boxShadow: `0 0 10px ${palette.green}`,
              opacity: cursorOn ? 1 : 0.35,
            }}
          />
          grapeee · editing {filesEdited} files
        </div>
      </div>
    </div>
  );
}

function FinalQuestionScene() {
  const frame = useCurrentFrame();
  const questionOpacity = fadeWindow(frame, 210, 234, 252, 272);
  const joinOpacity = fadeWindow(frame, 238, 262, 282, 300);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "32%",
          left: 0,
          right: 0,
          opacity: questionOpacity,
          filter: `blur(${interpolate(questionOpacity, [0, 1], [20, 0])}px)`,
          transform: `translateY(${interpolate(questionOpacity, [0, 1], [24, 0])}px)`,
          color: palette.text,
          fontSize: 78,
          lineHeight: 0.96,
          letterSpacing: "-0.07em",
          fontWeight: 700,
        }}
      >
        What should we build?
      </div>

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          opacity: joinOpacity,
          filter: `blur(${interpolate(joinOpacity, [0, 1], [16, 0])}px)`,
          transform: `translateY(${interpolate(joinOpacity, [0, 1], [18, 0])}px)`,
          fontSize: 68,
          lineHeight: 1,
          letterSpacing: "-0.06em",
          fontWeight: 700,
          color: palette.text,
        }}
      >
        Join <span style={{ color: palette.purple }}>grapeee.com</span>
      </div>
    </div>
  );
}

function LogoScene() {
  const frame = useCurrentFrame();
  const logoOpacity = between(frame, 284, 308);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        opacity: logoOpacity,
        filter: `blur(${interpolate(logoOpacity, [0, 1], [22, 0])}px)`,
      }}
    >
      <div
        style={{
          display: "grid",
          justifyItems: "center",
          gap: 18,
          transform: `translateY(${interpolate(logoOpacity, [0, 1], [26, 0])}px) scale(${interpolate(
            logoOpacity,
            [0, 1],
            [0.96, 1],
          )})`,
        }}
      >
        <div
          style={{
            color: palette.purple,
            fontSize: 88,
            lineHeight: 0.9,
            letterSpacing: "-0.08em",
            fontWeight: 700,
            textShadow: "0 0 34px rgba(184,117,185,0.26)",
          }}
        >
          grapeee
        </div>
        <div
          style={{
            color: palette.muted,
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 14,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          build faster in roblox
        </div>
      </div>
    </div>
  );
}

export function LandingIntroComposition() {
  return (
    <AbsoluteFill
      style={{
        background: palette.bg,
        overflow: "hidden",
        fontFamily: '"Space Grotesk", sans-serif',
      }}
    >
      <Background />
      <PromptScene />
      <DiffBurstScene />
      <FinalQuestionScene />
      <LogoScene />
    </AbsoluteFill>
  );
}
