import {
  Suspense,
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import {
  Text3D,
  Text,
  Environment,
  Float,
  Lightformer,
  RoundedBox,
} from "@react-three/drei"
import * as THREE from "three"

const FONT_PATH = "/fonts/nunito-bold.json"

// Font glyph data loaded at module level for character width calculations
let fontData: {
  glyphs: Record<string, { ha: number }>
  resolution: number
} | null = null
const fontDataPromise =
  typeof window !== "undefined"
    ? fetch(FONT_PATH)
        .then((r) => r.json())
        .then((data) => {
          fontData = data
        })
    : Promise.resolve()

/** Measure the world-unit width of a string at a given size using font metrics */
function measureTextWidth(text: string, size: number): number {
  if (!fontData) return text.length * size * 0.6
  const scale = size / fontData.resolution
  const spacing = size * 0.12
  const chars = Array.from(text)
  const charWidths = chars.map((char) => {
    const glyph = fontData!.glyphs[char]
    return glyph ? glyph.ha * scale : size * 0.6
  })
  return (
    charWidths.reduce((sum, w) => sum + w, 0) + spacing * (chars.length - 1)
  )
}

function BalloonMaterial() {
  return (
    <meshPhysicalMaterial
      color="#ffffff"
      metalness={0.95}
      roughness={0.08}
      clearcoat={1}
      clearcoatRoughness={0.05}
      reflectivity={1}
      envMapIntensity={1.8}
    />
  )
}

function BalloonEnvironment() {
  return (
    <Environment resolution={256}>
      <Lightformer
        form="rect"
        intensity={3}
        color="white"
        scale={[12, 6, 1]}
        position={[0, 5, -2]}
      />
      <Lightformer
        form="rect"
        intensity={2}
        color="#f0f4ff"
        scale={[10, 8, 1]}
        position={[0, 0, 5]}
      />
      <Lightformer
        form="rect"
        intensity={1.5}
        color="#e8ecff"
        scale={[10, 4, 1]}
        position={[0, -4, 2]}
      />
      <Lightformer
        form="circle"
        intensity={2}
        color="#dce4ff"
        scale={3}
        position={[-6, 2, 0]}
      />
      <Lightformer
        form="circle"
        intensity={2}
        color="#dce4ff"
        scale={3}
        position={[6, 2, 0]}
      />
      <Lightformer
        form="circle"
        intensity={5}
        color="white"
        scale={1.5}
        position={[2, 3, 4]}
      />
    </Environment>
  )
}

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function BalloonLetter({
  char,
  position,
  size,
  index,
}: {
  char: string
  position: [number, number, number]
  size: number
  index: number
}) {
  const speed = 1.0 + seededRandom(index) * 1.5
  const floatIntensity = 0.2 + seededRandom(index + 100) * 0.3
  const rotIntensity = 0.04 + seededRandom(index + 200) * 0.08

  const meshRef = useRef<THREE.Group>(null)
  const [jiggling, setJiggling] = useState(false)
  const jiggleTime = useRef(0)

  useFrame((_, delta) => {
    if (!meshRef.current) return

    if (jiggling) {
      jiggleTime.current += delta
      const t = jiggleTime.current
      const duration = 0.6

      if (t >= duration) {
        setJiggling(false)
        jiggleTime.current = 0
        meshRef.current.rotation.z = 0
        meshRef.current.rotation.x = 0
        meshRef.current.scale.setScalar(1)
      } else {
        const decay = Math.exp(-t * 6)
        const freq = 18
        const wobble = Math.sin(t * freq) * decay
        meshRef.current.rotation.z = wobble * 0.2
        meshRef.current.rotation.x = wobble * 0.1
        meshRef.current.scale.set(1 + wobble * 0.08, 1 - wobble * 0.08, 1)
      }
    }
  })

  const handleClick = useCallback(() => {
    if (!jiggling) {
      setJiggling(true)
      jiggleTime.current = 0
    }
  }, [jiggling])

  return (
    <Float
      speed={speed}
      rotationIntensity={rotIntensity}
      floatIntensity={floatIntensity}
      floatingRange={[-0.08, 0.08]}
    >
      <group position={position}>
        <group ref={meshRef} onClick={handleClick}>
          <Text3D
            font={FONT_PATH}
            size={size}
            height={size * 0.5}
            bevelEnabled
            bevelThickness={size * 0.15}
            bevelSize={size * 0.1}
            bevelSegments={12}
            curveSegments={16}
          >
            {char}
            <BalloonMaterial />
          </Text3D>
        </group>
      </group>
    </Float>
  )
}

function BalloonWord({
  text,
  position,
  size,
  startIndex,
}: {
  text: string
  position: [number, number, number]
  size: number
  startIndex: number
}) {
  const [ready, setReady] = useState(!!fontData)
  const chars = useMemo(() => Array.from(text), [text])

  useEffect(() => {
    if (!fontData) {
      fontDataPromise.then(() => setReady(true))
    }
  }, [])

  if (!ready || !fontData) return null

  const scale = size / fontData.resolution
  const charWidths = chars.map((char) => {
    const glyph = fontData!.glyphs[char]
    return glyph ? glyph.ha * scale : size * 0.6
  })

  const spacing = size * 0.12
  const totalWidth =
    charWidths.reduce((sum, w) => sum + w, 0) + spacing * (chars.length - 1)
  let xOffset = -totalWidth / 2

  return (
    <group position={position}>
      {chars.map((char, i) => {
        const x = xOffset
        xOffset += charWidths[i] + spacing
        return (
          <BalloonLetter
            key={i}
            char={char}
            position={[x, 0, 0]}
            size={size}
            index={startIndex + i}
          />
        )
      })}
    </group>
  )
}

function BalloonButton({
  position,
  size,
  onStart,
  visible,
}: {
  position: [number, number, number]
  size: number
  onStart: () => void
  visible: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const scaleRef = useRef(visible ? 1 : 0)

  const btnScale = size * 0.55
  const text = "start"
  const textSize = btnScale * 1.1

  const textWidth = useMemo(() => {
    if (!fontData) return 0
    const scale = textSize / fontData.resolution
    return Array.from(text).reduce((sum, char) => {
      const glyph = fontData!.glyphs[char]
      return sum + (glyph ? glyph.ha * scale : textSize * 0.6)
    }, 0)
  }, [textSize])

  const horizontalPadding = btnScale * 1.8
  const padX = textWidth + horizontalPadding
  const padY = btnScale * 1.6
  const depth = btnScale * 0.7
  const radius = btnScale * 0.4

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const target = !visible ? 0 : pressed ? 0.92 : hovered ? 1.08 : 1
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, target, delta * 8)
    groupRef.current.scale.setScalar(scaleRef.current)
  })

  const handlePointerOver = useCallback(() => {
    if (!visible) return
    setHovered(true)
    document.body.style.cursor = "pointer"
  }, [visible])

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    setPressed(false)
    document.body.style.cursor = "auto"
  }, [])

  const handlePointerDown = useCallback(() => {
    if (!visible) return
    setPressed(true)
  }, [visible])

  const handlePointerUp = useCallback(() => {
    setPressed(false)
  }, [])

  const handleClick = useCallback(() => {
    if (!visible) return
    onStart()
  }, [onStart, visible])

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.03}
      floatIntensity={0.15}
      floatingRange={[-0.05, 0.05]}
    >
      <group
        position={position}
        ref={groupRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        <RoundedBox args={[padX, padY, depth]} radius={radius} smoothness={8}>
          <meshPhysicalMaterial
            color={hovered ? "#f0f4ff" : "#ffffff"}
            metalness={0.9}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.05}
            reflectivity={1}
            envMapIntensity={hovered ? 2.2 : 1.8}
          />
        </RoundedBox>

        <Text
          font="/fonts/nunito-bold.ttf"
          fontSize={textSize}
          position={[0, 0, depth / 2 + 0.01]}
          anchorX="center"
          anchorY="middle"
          color="#2a2a2a"
        >
          {text}
        </Text>
      </group>
    </Float>
  )
}

/**
 * Animating scene that transitions between two layouts:
 *
 * LANDING (started=false):
 *   "meet"     (line 1, centered)
 *   "me"       (line 2, centered)
 *   "halfway?" (line 3, centered)
 *   [start]    (button)
 *
 * COMPACT (started=true):
 *   "meet me"  (line 1, merged — words slide together)
 *   "halfway?" (line 2)
 *   — entire group scales down and floats up, button disappears
 *
 * Animation strategy:
 *   - Each word group ("meet", "me", "halfway?") has its own position animated via useFrame + lerp.
 *   - The entire group scales uniformly (GPU transform, no geometry rebuild).
 *   - The button shrinks to 0 when started.
 */
function ResponsiveScene({
  started,
  onStart,
}: {
  started: boolean
  onStart: () => void
}) {
  const { viewport } = useThree()

  // --- Base size at landing (same as original) ---
  const maxTextWidth = viewport.width * 0.85
  const charsInLongestLine = 8.5
  const charWidthFactor = 0.7
  const size = Math.min(
    maxTextWidth / (charsInLongestLine * charWidthFactor),
    1.0
  )

  const lineGap = size * 0.4

  // --- Landing positions (3-line centered layout) ---
  // The total height of the 3-line block + button, centered at y=0
  const landingMeetY = lineGap + size
  const landingMeY = 0
  const landingHalfwayY = -(lineGap + size)
  const landingButtonY = -(lineGap + size) * 2 - size * 0.3

  // --- Compact positions ---
  // Scale factor for the compact layout
  const compactScale = 0.8

  // In the compact layout we merge "meet" and "me" onto one line.
  // We compute the X offsets needed so the two words sit side-by-side
  // (centered as a group) at the *original* size, then apply group scale.
  const meetWidth = measureTextWidth("meet", size)
  const meWidth = measureTextWidth("me", size)
  const wordGap = size * 0.45
  const totalMeetMeWidth = meetWidth + wordGap + meWidth
  const meetXCompact = -totalMeetMeWidth / 2 + meetWidth / 2
  const meXCompact = totalMeetMeWidth / 2 - meWidth / 2

  // After merge, "meet me" on line 1, "halfway?" on line 2
  // Both centered at x=0. Use a tighter line gap for compact.
  const compactLineGap = size * 0.35
  const compactLine1Y = compactLineGap / 2 + size / 2
  const compactLine2Y = -(compactLineGap / 2 + size / 2)

  // The compact group sits near the top of viewport.
  // viewport.height is world units. We want the top of the text
  // near the top of the visible area.
  // After scaling, the group's apparent top is at:
  //   groupY + (compactLine1Y + size/2) * compactScale
  // We want that at roughly viewport.height/2 - some margin
  const margin = size * 1.6
  const compactGroupY =
    viewport.height / 2 - margin - (compactLine1Y + size / 2) * compactScale

  // --- Animated values ---
  const meetGroupRef = useRef<THREE.Group>(null)
  const meGroupRef = useRef<THREE.Group>(null)
  const halfwayGroupRef = useRef<THREE.Group>(null)
  const rootGroupRef = useRef<THREE.Group>(null)

  const anim = useRef({
    // Word positions (in local group space, pre-scale)
    meetX: 0,
    meetY: landingMeetY,
    meX: 0,
    meY: landingMeY,
    halfwayY: landingHalfwayY,
    // Root group transform
    groupY: 0,
    groupScale: 1,
  })

  useFrame((_, delta) => {
    const a = anim.current
    const speed = delta * 3.0

    // Lerp with snap — snap to target when within epsilon to avoid jitter
    const EPSILON = 0.001
    function lerpSnap(current: number, target: number, t: number) {
      const result = THREE.MathUtils.lerp(current, target, t)
      return Math.abs(result - target) < EPSILON ? target : result
    }

    // --- Targets ---
    const tMeetX = started ? meetXCompact : 0
    const tMeetY = started ? compactLine1Y : landingMeetY
    const tMeX = started ? meXCompact : 0
    const tMeY = started ? compactLine1Y : landingMeY
    const tHalfwayY = started ? compactLine2Y : landingHalfwayY
    const tGroupY = started ? compactGroupY : 0
    const tGroupScale = started ? compactScale : 1

    // --- Lerp ---
    a.meetX = lerpSnap(a.meetX, tMeetX, speed)
    a.meetY = lerpSnap(a.meetY, tMeetY, speed)
    a.meX = lerpSnap(a.meX, tMeX, speed)
    a.meY = lerpSnap(a.meY, tMeY, speed)
    a.halfwayY = lerpSnap(a.halfwayY, tHalfwayY, speed)
    a.groupY = lerpSnap(a.groupY, tGroupY, speed)
    a.groupScale = lerpSnap(a.groupScale, tGroupScale, speed)

    // --- Apply ---
    if (meetGroupRef.current) {
      meetGroupRef.current.position.set(a.meetX, a.meetY, 0)
    }
    if (meGroupRef.current) {
      meGroupRef.current.position.set(a.meX, a.meY, 0)
    }
    if (halfwayGroupRef.current) {
      halfwayGroupRef.current.position.set(0, a.halfwayY, 0)
    }
    if (rootGroupRef.current) {
      rootGroupRef.current.position.set(0, a.groupY, 0)
      rootGroupRef.current.scale.setScalar(a.groupScale)
    }
  })

  return (
    <>
      <BalloonEnvironment />
      <ambientLight intensity={0.8} />
      <directionalLight position={[0, 3, 5]} intensity={1.5} />
      <pointLight position={[-3, 2, 4]} intensity={1} color="#f0f4ff" />

      <group ref={rootGroupRef}>
        <group ref={meetGroupRef} position={[0, landingMeetY, 0]}>
          <BalloonWord
            text="meet"
            position={[0, 0, 0]}
            size={size}
            startIndex={0}
          />
        </group>
        <group ref={meGroupRef} position={[0, landingMeY, 0]}>
          <BalloonWord
            text="me"
            position={[0, 0, 0]}
            size={size}
            startIndex={4}
          />
        </group>
        <group ref={halfwayGroupRef} position={[0, landingHalfwayY, 0]}>
          <BalloonWord
            text="halfway?"
            position={[0, 0, 0]}
            size={size}
            startIndex={6}
          />
        </group>
        <BalloonButton
          position={[0, landingButtonY, 0]}
          size={size}
          onStart={onStart}
          visible={!started}
        />
      </group>
    </>
  )
}

export function BalloonText({
  started,
  onStart,
}: {
  started: boolean
  onStart: () => void
}) {
  return (
    <div className="absolute inset-0 z-10">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 10], fov: 40 }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ResponsiveScene started={started} onStart={onStart} />
        </Suspense>
      </Canvas>
    </div>
  )
}
