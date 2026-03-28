import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import { CloudBackground } from "@/components/clouds"
import { BalloonText } from "@/components/balloon-text"
import { LandingForm } from "@/components/landing-form"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  const [started, setStarted] = useState(false)

  const handleStart = useCallback(() => {
    setStarted(true)
  }, [])

  return (
    <div className="sky-gradient relative h-svh overflow-hidden">
      {/* Atmospheric glow overlays */}
      <div
        className="pointer-events-none absolute opacity-40"
        style={{
          width: 800,
          height: 1200,
          top: "-10%",
          left: "-15%",
          background:
            "radial-gradient(50% 50%, rgba(255,255,255,0.8) 0%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute opacity-40"
        style={{
          width: 900,
          height: 1000,
          top: "-20%",
          right: "-10%",
          background:
            "radial-gradient(50% 50%, rgba(255,255,255,0.6) 0%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute opacity-30"
        style={{
          width: 1600,
          height: 700,
          top: "-30%",
          left: "-10%",
          background:
            "radial-gradient(50% 50%, rgba(255,255,255,0.7) 0%, transparent 100%)",
        }}
      />
      <CloudBackground />
      <BalloonText started={started} onStart={handleStart} />
      <LandingForm visible={started} />
    </div>
  )
}
