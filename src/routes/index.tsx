import { createFileRoute } from "@tanstack/react-router"
import { Card, CardDescription, CardHeader } from "@/components/ui/card"
import { AddressForm } from "@/components/address-form"
import { CloudBackground } from "@/components/clouds"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  return (
    <div className="sky-gradient relative flex min-h-svh items-center justify-center overflow-hidden p-6">
      {/* Atmospheric glow overlays — soft white radial gradients like scattered light */}
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
      <Card className="relative z-10 w-full max-w-lg shadow-2xl backdrop-blur-sm">
        <CardHeader>
          <CardDescription>
            Find a fair meeting point based on equal driving time
          </CardDescription>
        </CardHeader>
        <AddressForm />
      </Card>
    </div>
  )
}
