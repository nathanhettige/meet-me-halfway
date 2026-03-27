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
  Center,
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
      {/* Large bright overhead fill — makes the top faces bright white */}
      <Lightformer
        form="rect"
        intensity={3}
        color="white"
        scale={[12, 6, 1]}
        position={[0, 5, -2]}
      />
      {/* Front fill — illuminates the faces pointing at camera */}
      <Lightformer
        form="rect"
        intensity={2}
        color="#f0f4ff"
        scale={[10, 8, 1]}
        position={[0, 0, 5]}
      />
      {/* Bottom fill — prevents dark undersides */}
      <Lightformer
        form="rect"
        intensity={1.5}
        color="#e8ecff"
        scale={[10, 4, 1]}
        position={[0, -4, 2]}
      />
      {/* Left rim — subtle edge highlight */}
      <Lightformer
        form="circle"
        intensity={2}
        color="#dce4ff"
        scale={3}
        position={[-6, 2, 0]}
      />
      {/* Right rim */}
      <Lightformer
        form="circle"
        intensity={2}
        color="#dce4ff"
        scale={3}
        position={[6, 2, 0]}
      />
      {/* Hot specular spot — creates the bright "shine" highlight */}
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

// Deterministic pseudo-random based on index for consistent float params
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

  // Jiggle animation state
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
        // Reset when done
        setJiggling(false)
        jiggleTime.current = 0
        meshRef.current.rotation.z = 0
        meshRef.current.rotation.x = 0
        meshRef.current.scale.setScalar(1)
      } else {
        // Damped oscillation — decays over time
        const decay = Math.exp(-t * 6)
        const freq = 18
        const wobble = Math.sin(t * freq) * decay

        meshRef.current.rotation.z = wobble * 0.2
        meshRef.current.rotation.x = wobble * 0.1
        // Slight squash & stretch
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

// Uses font metric data (ha = horizontal advance) to calculate character positions
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

  // Calculate character widths from font metrics
  const scale = size / fontData.resolution
  const charWidths = chars.map((char) => {
    const glyph = fontData!.glyphs[char]
    return glyph ? glyph.ha * scale : size * 0.6
  })

  const spacing = size * 0.06
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
  onNavigate,
}: {
  position: [number, number, number]
  size: number
  onNavigate: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const scaleRef = useRef(1)

  // Button dimensions relative to text size
  const btnScale = size * 0.55
  const text = "start"
  const textSize = btnScale * 1.1

  // Calculate text width to center it on the button
  const textWidth = useMemo(() => {
    if (!fontData) return 0
    const scale = textSize / fontData.resolution
    return Array.from(text).reduce((sum, char) => {
      const glyph = fontData!.glyphs[char]
      return sum + (glyph ? glyph.ha * scale : textSize * 0.6)
    }, 0)
  }, [textSize])

  // Pill dimensions derived from actual text width
  const horizontalPadding = btnScale * 1.8
  const padX = textWidth + horizontalPadding
  const padY = btnScale * 1.6
  const depth = btnScale * 0.7
  const radius = btnScale * 0.4

  // Smooth hover/press scale animation
  useFrame((_, delta) => {
    if (!groupRef.current) return
    const target = pressed ? 0.92 : hovered ? 1.08 : 1
    scaleRef.current = THREE.MathUtils.lerp(
      scaleRef.current,
      target,
      delta * 12
    )
    groupRef.current.scale.setScalar(scaleRef.current)
  })

  // Change cursor on hover
  const handlePointerOver = useCallback(() => {
    setHovered(true)
    document.body.style.cursor = "pointer"
  }, [])

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    setPressed(false)
    document.body.style.cursor = "auto"
  }, [])

  const handlePointerDown = useCallback(() => {
    setPressed(true)
  }, [])

  const handlePointerUp = useCallback(() => {
    setPressed(false)
  }, [])

  const handleClick = useCallback(() => {
    onNavigate()
  }, [onNavigate])

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
        {/* Pill-shaped button background */}
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

        {/* Button text — centered on the pill */}
        <group position={[-textWidth / 2, -textSize * 0.4, depth / 2 + 0.01]}>
          <Text3D
            font={FONT_PATH}
            size={textSize}
            height={textSize * 0.15}
            bevelEnabled
            bevelThickness={textSize * 0.04}
            bevelSize={textSize * 0.03}
            bevelSegments={6}
            curveSegments={12}
          >
            {text}
            <meshPhysicalMaterial
              color="#4a9eed"
              metalness={0.3}
              roughness={0.2}
              clearcoat={0.8}
              clearcoatRoughness={0.1}
              envMapIntensity={1.2}
            />
          </Text3D>
        </group>
      </group>
    </Float>
  )
}

function ResponsiveScene({ onNavigate }: { onNavigate: () => void }) {
  const { viewport } = useThree()

  // Scale text to fit viewport width with padding
  // viewport.width gives the Three.js world units visible at z=0
  const maxTextWidth = viewport.width * 0.85
  // "halfway?" is the widest line (~8 chars)
  // Nunito Bold is a wider/rounder font — each char ~0.7 * size units wide
  const charsInLongestLine = 8.5
  const charWidthFactor = 0.7
  const size = Math.min(
    maxTextWidth / (charsInLongestLine * charWidthFactor),
    1.0
  )

  const lineGap = size * 0.4

  return (
    <>
      <BalloonEnvironment />
      <ambientLight intensity={0.8} />
      <directionalLight position={[0, 3, 5]} intensity={1.5} />
      <pointLight position={[-3, 2, 4]} intensity={1} color="#f0f4ff" />

      <Center>
        <group>
          <BalloonWord
            text="meet"
            position={[0, lineGap + size, 0]}
            size={size}
            startIndex={0}
          />
          <BalloonWord
            text="me"
            position={[0, 0, 0]}
            size={size}
            startIndex={4}
          />
          <BalloonWord
            text="halfway?"
            position={[0, -(lineGap + size), 0]}
            size={size}
            startIndex={6}
          />
          <BalloonButton
            position={[0, -(lineGap + size) * 2 - size * 0.3, 0]}
            size={size}
            onNavigate={onNavigate}
          />
        </group>
      </Center>
    </>
  )
}

export function BalloonText({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="absolute inset-0 z-10">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 10], fov: 40 }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ResponsiveScene onNavigate={onNavigate} />
        </Suspense>
      </Canvas>
    </div>
  )
}
