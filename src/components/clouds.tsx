/**
 * 3D-style cloud SVGs with gradient fills and soft shadows,
 * inspired by the Wing Sweet Fleet page's puffy rendered clouds.
 */

function Cloud3D({
  width = 200,
  style,
  flip,
}: {
  width?: number
  style?: React.CSSProperties
  flip?: boolean
}) {
  const id = `cloud-${width}-${flip ? "f" : "n"}`
  return (
    <svg
      width={width}
      height={width * 0.55}
      viewBox="0 0 300 165"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        ...style,
        transform: flip ? "scaleX(-1)" : undefined,
        filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.08))",
      }}
    >
      <defs>
        {/* Main cloud body gradient — white top, slightly blue-gray bottom */}
        <radialGradient id={`${id}-body`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="white" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(220,235,248,0.9)" />
        </radialGradient>
        {/* Highlight for the top of the cloud */}
        <radialGradient id={`${id}-highlight`} cx="45%" cy="20%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Shadow underneath */}
        <radialGradient id={`${id}-shadow`} cx="50%" cy="90%" r="60%">
          <stop offset="0%" stopColor="rgba(100,140,180,0.3)" />
          <stop offset="100%" stopColor="rgba(100,140,180,0)" />
        </radialGradient>
      </defs>

      {/* Cloud body — overlapping circles for puffy shape */}
      <g>
        {/* Bottom base — wide and flat */}
        <ellipse cx="150" cy="120" rx="130" ry="40" fill={`url(#${id}-body)`} />
        {/* Large center puff */}
        <circle cx="150" cy="80" r="55" fill={`url(#${id}-body)`} />
        {/* Left puff */}
        <circle cx="90" cy="95" r="45" fill={`url(#${id}-body)`} />
        {/* Right puff */}
        <circle cx="210" cy="90" r="48" fill={`url(#${id}-body)`} />
        {/* Top-left bump */}
        <circle cx="115" cy="65" r="35" fill={`url(#${id}-body)`} />
        {/* Top-right bump */}
        <circle cx="185" cy="60" r="38" fill={`url(#${id}-body)`} />
        {/* Peak puff */}
        <circle cx="155" cy="50" r="30" fill={`url(#${id}-body)`} />
      </g>

      {/* Highlight layer — brighter on top */}
      <g>
        <circle
          cx="140"
          cy="60"
          r="40"
          fill={`url(#${id}-highlight)`}
          opacity="0.7"
        />
        <circle
          cx="180"
          cy="55"
          r="30"
          fill={`url(#${id}-highlight)`}
          opacity="0.5"
        />
      </g>

      {/* Subtle bottom shadow */}
      <ellipse cx="150" cy="135" rx="110" ry="25" fill={`url(#${id}-shadow)`} />
    </svg>
  )
}

function CloudSmall({
  width = 140,
  style,
  flip,
}: {
  width?: number
  style?: React.CSSProperties
  flip?: boolean
}) {
  const id = `cloud-sm-${width}-${flip ? "f" : "n"}`
  return (
    <svg
      width={width}
      height={width * 0.5}
      viewBox="0 0 220 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        ...style,
        transform: flip ? "scaleX(-1)" : undefined,
        filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.06))",
      }}
    >
      <defs>
        <radialGradient id={`${id}-body`} cx="50%" cy="25%" r="75%">
          <stop offset="0%" stopColor="white" />
          <stop offset="65%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(215,230,245,0.85)" />
        </radialGradient>
        <radialGradient id={`${id}-highlight`} cx="40%" cy="15%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-shadow`} cx="50%" cy="85%" r="55%">
          <stop offset="0%" stopColor="rgba(100,140,180,0.25)" />
          <stop offset="100%" stopColor="rgba(100,140,180,0)" />
        </radialGradient>
      </defs>

      <g>
        <ellipse cx="110" cy="80" rx="95" ry="28" fill={`url(#${id}-body)`} />
        <circle cx="110" cy="55" r="38" fill={`url(#${id}-body)`} />
        <circle cx="70" cy="62" r="30" fill={`url(#${id}-body)`} />
        <circle cx="150" cy="60" r="32" fill={`url(#${id}-body)`} />
        <circle cx="110" cy="40" r="22" fill={`url(#${id}-body)`} />
      </g>

      <circle
        cx="100"
        cy="42"
        r="25"
        fill={`url(#${id}-highlight)`}
        opacity="0.6"
      />
      <ellipse cx="110" cy="92" rx="75" ry="16" fill={`url(#${id}-shadow)`} />
    </svg>
  )
}

type CloudConfig = {
  id: number
  top: string
  delay: string
  duration: string
  bobDuration: string
  opacity: number
  width: number
  variant: "large" | "small"
  reverse: boolean
  flip: boolean
  rotate: number
}

const clouds: CloudConfig[] = [
  {
    id: 1,
    top: "3%",
    delay: "0s",
    duration: "90s",
    bobDuration: "8s",
    opacity: 0.7,
    width: 280,
    variant: "large",
    reverse: false,
    flip: false,
    rotate: -2,
  },
  {
    id: 2,
    top: "12%",
    delay: "-25s",
    duration: "70s",
    bobDuration: "6s",
    opacity: 0.85,
    width: 200,
    variant: "small",
    reverse: true,
    flip: true,
    rotate: 3,
  },
  {
    id: 3,
    top: "28%",
    delay: "-45s",
    duration: "110s",
    bobDuration: "9s",
    opacity: 0.5,
    width: 340,
    variant: "large",
    reverse: false,
    flip: true,
    rotate: 5,
  },
  {
    id: 4,
    top: "52%",
    delay: "-12s",
    duration: "80s",
    bobDuration: "7s",
    opacity: 0.75,
    width: 180,
    variant: "small",
    reverse: true,
    flip: false,
    rotate: -3,
  },
  {
    id: 5,
    top: "68%",
    delay: "-60s",
    duration: "120s",
    bobDuration: "10s",
    opacity: 0.45,
    width: 300,
    variant: "large",
    reverse: false,
    flip: false,
    rotate: 8,
  },
  {
    id: 6,
    top: "40%",
    delay: "-35s",
    duration: "75s",
    bobDuration: "5.5s",
    opacity: 0.65,
    width: 160,
    variant: "small",
    reverse: false,
    flip: true,
    rotate: -5,
  },
  {
    id: 7,
    top: "78%",
    delay: "-55s",
    duration: "95s",
    bobDuration: "7.5s",
    opacity: 0.4,
    width: 260,
    variant: "large",
    reverse: true,
    flip: true,
    rotate: 10,
  },
  {
    id: 8,
    top: "18%",
    delay: "-18s",
    duration: "85s",
    bobDuration: "6.5s",
    opacity: 0.55,
    width: 150,
    variant: "small",
    reverse: false,
    flip: false,
    rotate: -4,
  },
  {
    id: 9,
    top: "60%",
    delay: "-70s",
    duration: "100s",
    bobDuration: "8.5s",
    opacity: 0.35,
    width: 220,
    variant: "large",
    reverse: true,
    flip: false,
    rotate: 6,
  },
]

export function CloudBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {clouds.map((cloud) => {
        const Svg = cloud.variant === "large" ? Cloud3D : CloudSmall
        return (
          <div
            key={cloud.id}
            className={
              cloud.reverse
                ? "animate-cloud-drift-reverse absolute"
                : "animate-cloud-drift absolute"
            }
            style={
              {
                top: cloud.top,
                "--cloud-duration": cloud.duration,
                animationDelay: cloud.delay,
              } as React.CSSProperties
            }
          >
            <div
              className="animate-cloud-bob"
              style={
                {
                  "--bob-duration": cloud.bobDuration,
                } as React.CSSProperties
              }
            >
              <Svg
                width={cloud.width}
                flip={cloud.flip}
                style={{
                  opacity: cloud.opacity,
                  transform: `${cloud.flip ? "scaleX(-1) " : ""}rotate(${cloud.rotate}deg)`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
