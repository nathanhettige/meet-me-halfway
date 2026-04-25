import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { APIProvider } from "@vis.gl/react-google-maps"
import { AnimatePresence, motion } from "framer-motion"
import { MapPin } from "lucide-react"
import type { Place } from "@/server/maps/types"
import { useSearch } from "@/hooks/use-maps"
import { CloudBackground } from "@/components/clouds"
import { ResultsHeader } from "@/components/results/results-header"
import { MiniMap } from "@/components/results/mini-map"
import { PlaceCard } from "@/components/results/place-card"
import { PlaceDetailSheet } from "@/components/results/place-detail-sheet"

type SearchParams = {
  placeIds: string
}

export const Route = createFileRoute("/results")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    placeIds: (search.placeIds as string) || "",
  }),
  component: ResultsPage,
})

const LOADING_MESSAGES = [
  "calculating drive times",
  "finding the midpoint",
  "searching for great spots",
  "almost there",
]

function ResultsPage() {
  const { placeIds: placeIdsParam } = Route.useSearch()
  const placeIds = placeIdsParam ? placeIdsParam.split(",") : []
  const searchResult = useSearch(placeIds)
  const navigate = useNavigate()
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [isMapExpanded, setIsMapExpanded] = useState(false)

  useEffect(() => {
    if (!placeIdsParam) {
      navigate({ to: "/" })
    }
  }, [placeIdsParam, navigate])

  const isLoading = !searchResult.data

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <ResultsLoadingScreen key="loading" />
        ) : (
          <ResultsContent
            key="results"
            data={searchResult.data}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            isMapExpanded={isMapExpanded}
            setIsMapExpanded={setIsMapExpanded}
            onBack={() => navigate({ to: "/" })}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/** Animated loading screen with rotating status messages */
function ResultsLoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      )
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="sky-gradient relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <CloudBackground />
      {/* Logo */}
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <span className="text-3xl font-bold tracking-tight text-white">
          meet me halfway
        </span>
      </motion.div>

      {/* Animated pin with pulse ring */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      >
        {/* Pulsing rings */}
        <motion.div
          className="absolute inset-0 m-auto size-12 rounded-full bg-white/20"
          animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 m-auto size-12 rounded-full bg-white/15"
          animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.6,
          }}
        />

        {/* Pin icon */}
        <div className="relative flex size-12 items-center justify-center rounded-full bg-white shadow-lg shadow-white/25">
          <MapPin className="size-6 text-sky-blue" />
        </div>
      </motion.div>

      {/* Rotating status messages */}
      <div className="h-7 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            className="text-center text-base font-medium text-white/80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {LOADING_MESSAGES[messageIndex]}...
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Subtle dot progress */}
      <div className="flex items-center gap-2">
        {LOADING_MESSAGES.map((_, i) => (
          <motion.div
            key={i}
            className="size-1.5 rounded-full"
            animate={{
              backgroundColor:
                i <= messageIndex
                  ? "rgba(255, 255, 255, 1)"
                  : "rgba(255, 255, 255, 0.3)",
              scale: i === messageIndex ? 1.3 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

/** Results content with staggered entrance animations */
function ResultsContent({
  data,
  selectedPlace,
  setSelectedPlace,
  isMapExpanded,
  setIsMapExpanded,
  onBack,
}: {
  data: NonNullable<ReturnType<typeof useSearch>["data"]>
  selectedPlace: Place | null
  setSelectedPlace: (place: Place | null) => void
  isMapExpanded: boolean
  setIsMapExpanded: (expanded: boolean) => void
  onBack: () => void
}) {
  const cityName = data.snap?.cityName || "Midpoint"
  const filteredPlaces = data.places.filter((place) => place.photos?.length)

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header — slides down */}
      <motion.div
        className="sticky top-0 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      >
        <ResultsHeader
          cityName={cityName}
          placeCount={filteredPlaces.length}
          onBack={onBack}
        />
      </motion.div>

      {/* Map — fades in */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      >
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ""}>
          <MiniMap
            coordinates={data.coordinates}
            midpoint={data.midpoint}
            places={filteredPlaces}
            isExpanded={isMapExpanded}
            onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
            onPlaceSelect={setSelectedPlace}
          />
        </APIProvider>
      </motion.div>

      <main className="px-4 pt-5 pb-8">
        {/* Section header — fades up */}
        <motion.div
          className="mb-4 flex items-end justify-between"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        >
          <div>
            <h2 className="text-xl font-bold text-foreground">
              places to meet
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {filteredPlaces.length} spots found nearby
            </p>
          </div>
        </motion.div>

        {/* Place cards — staggered entrance */}
        <div className="grid gap-6">
          {filteredPlaces.map((place, index) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.3 + index * 0.07,
              }}
            >
              <PlaceCard
                place={place}
                onSelect={() => setSelectedPlace(place)}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom safe area padding */}
        <div className="h-6" />
      </main>

      <PlaceDetailSheet
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
      />
    </motion.div>
  )
}
