import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import { CloudBackground } from "@/components/clouds"
import { BalloonText } from "@/components/balloon-text"
import { LandingForm, hasPersistedFormData } from "@/components/landing-form"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  // If the user is returning from the results page, skip the intro
  const returning = hasPersistedFormData()
  const [started, setStarted] = useState(returning)

  const handleStart = useCallback(() => {
    setStarted(true)
  }, [])

  return (
    <div className="sky-gradient relative h-dvh overflow-hidden">
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
      <LandingForm visible={started} returning={returning} />
      <footer className="absolute right-0 bottom-3 left-0 z-10 text-center text-xs text-white/60">
        <span>built by nathan hettige</span>
        <span className="mx-1.5">·</span>
        <a
          href="https://github.com/nathanhettige"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition-colors hover:text-white/90"
        >
          github
        </a>
        <span className="mx-1.5">·</span>
        <a
          href="mailto:nathan@hirustudios.com.au"
          className="underline underline-offset-2 transition-colors hover:text-white/90"
        >
          contact
        </a>
      </footer>
    </div>
  )
}
