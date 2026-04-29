import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { APIProvider } from "@vis.gl/react-google-maps"
import { AnimatePresence, motion } from "framer-motion"
import { MapPin, SearchX } from "lucide-react"
import type { Coordinates, Place } from "@/server/maps/types"
import { Button } from "@/components/ui/button"
import { useSearch } from "@/hooks/use-maps"
import { useIsDesktop } from "@/hooks/use-media-query"
import { CloudBackground } from "@/components/clouds"
import { CategoryFilter } from "@/components/results/category-filter"
import { ResultsHeader } from "@/components/results/results-header"
import { MiniMap } from "@/components/results/mini-map"
import { PlaceCard } from "@/components/results/place-card"
import { PlaceDetailSheet } from "@/components/results/place-detail-sheet"
import { PlaceDetailContent } from "@/components/results/place-detail-content"

type SearchParams = {
  placeIds: string
  categories?: string
}

export const Route = createFileRoute("/results")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    placeIds: (search.placeIds as string) || "",
    categories: (search.categories as string) || undefined,
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
  const { placeIds: placeIdsParam, categories: categoriesParam } =
    Route.useSearch()
  const placeIds = placeIdsParam ? placeIdsParam.split(",") : []
  const cachedResultRef = useRef<
    { midpoint: Coordinates; cityName: string } | undefined
  >(undefined)

  // Pass cached midpoint when filtering (skip optimization loop)
  const categories = categoriesParam ? categoriesParam.split(",") : undefined
  const midpointForQuery = categories
    ? cachedResultRef.current?.midpoint
    : undefined

  const searchResult = useSearch(placeIds, categories, midpointForQuery)
  const navigate = useNavigate()
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [isMapExpanded, setIsMapExpanded] = useState(false)

  // Cache the midpoint and city name from the first successful search
  useEffect(() => {
    if (searchResult.data?.midpoint && !cachedResultRef.current) {
      cachedResultRef.current = {
        midpoint: searchResult.data.midpoint,
        cityName: searchResult.data.snap?.cityName || "Midpoint",
      }
    }
  }, [searchResult.data?.midpoint, searchResult.data?.snap])

  // Derive selected categories from URL param (absent = no filter applied)
  const selectedCategories = new Set(
    categoriesParam ? categoriesParam.split(",") : []
  )

  const handleApplyCategories = (selected: Set<string>) => {
    const newCategories = Array.from(selected).join(",")
    navigate({
      to: "/results",
      search: { placeIds: placeIdsParam, categories: newCategories },
      replace: true,
    })
  }

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
            cachedCityName={cachedResultRef.current?.cityName}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            isMapExpanded={isMapExpanded}
            setIsMapExpanded={setIsMapExpanded}
            selectedCategories={selectedCategories}
            onApplyCategories={handleApplyCategories}
            hasFilters={!!categoriesParam}
            onClearFilters={() =>
              navigate({
                to: "/results",
                search: { placeIds: placeIdsParam },
                replace: true,
              })
            }
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
  cachedCityName,
  selectedPlace,
  setSelectedPlace,
  isMapExpanded,
  setIsMapExpanded,
  selectedCategories,
  onApplyCategories,
  hasFilters,
  onClearFilters,
  onBack,
}: {
  data: NonNullable<ReturnType<typeof useSearch>["data"]>
  cachedCityName: string | undefined
  selectedPlace: Place | null
  setSelectedPlace: (place: Place | null) => void
  isMapExpanded: boolean
  setIsMapExpanded: (expanded: boolean) => void
  selectedCategories: Set<string>
  onApplyCategories: (categories: Set<string>) => void
  hasFilters: boolean
  onClearFilters: () => void
  onBack: () => void
}) {
  const isDesktop = useIsDesktop()
  const cityName = data.snap?.cityName || cachedCityName || "Midpoint"
  const filteredPlaces = data.places.filter((place) => place.photos?.length)

  if (isDesktop) {
    return (
      <DesktopLayout
        data={data}
        cityName={cityName}
        filteredPlaces={filteredPlaces}
        selectedPlace={selectedPlace}
        setSelectedPlace={setSelectedPlace}
        selectedCategories={selectedCategories}
        onApplyCategories={onApplyCategories}
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
        onBack={onBack}
      />
    )
  }

  return (
    <MobileLayout
      data={data}
      cityName={cityName}
      filteredPlaces={filteredPlaces}
      selectedPlace={selectedPlace}
      setSelectedPlace={setSelectedPlace}
      isMapExpanded={isMapExpanded}
      setIsMapExpanded={setIsMapExpanded}
      selectedCategories={selectedCategories}
      onApplyCategories={onApplyCategories}
      hasFilters={hasFilters}
      onClearFilters={onClearFilters}
      onBack={onBack}
    />
  )
}

/** Mobile layout — single column scrollable (original design) */
function MobileLayout({
  data,
  cityName,
  filteredPlaces,
  selectedPlace,
  setSelectedPlace,
  isMapExpanded,
  setIsMapExpanded,
  selectedCategories,
  onApplyCategories,
  hasFilters,
  onClearFilters,
  onBack,
}: {
  data: NonNullable<ReturnType<typeof useSearch>["data"]>
  cityName: string
  filteredPlaces: Array<Place>
  selectedPlace: Place | null
  setSelectedPlace: (place: Place | null) => void
  isMapExpanded: boolean
  setIsMapExpanded: (expanded: boolean) => void
  selectedCategories: Set<string>
  onApplyCategories: (categories: Set<string>) => void
  hasFilters: boolean
  onClearFilters: () => void
  onBack: () => void
}) {
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
        {filteredPlaces.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onClearFilters={onClearFilters}
            onBack={onBack}
          />
        ) : (
          <>
            {/* Section header — fades up */}
            <motion.div
              className="mb-4 flex items-start justify-between"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.25,
              }}
            >
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  places to meet
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {filteredPlaces.length} spots found nearby
                </p>
              </div>
              <CategoryFilter
                selected={selectedCategories}
                onApply={onApplyCategories}
              />
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
                    driveTimes={data.driveTimes[place.id]}
                    onSelect={() => setSelectedPlace(place)}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Bottom safe area padding */}
        <div className="h-6" />
      </main>

      <PlaceDetailSheet
        place={selectedPlace}
        driveTimes={
          selectedPlace ? data.driveTimes[selectedPlace.id] : undefined
        }
        origins={data.origins}
        onClose={() => setSelectedPlace(null)}
      />
    </motion.div>
  )
}

/** Desktop layout — side panel + full-height map */
function DesktopLayout({
  data,
  cityName,
  filteredPlaces,
  selectedPlace,
  setSelectedPlace,
  selectedCategories,
  onApplyCategories,
  hasFilters,
  onClearFilters,
  onBack,
}: {
  data: NonNullable<ReturnType<typeof useSearch>["data"]>
  cityName: string
  filteredPlaces: Array<Place>
  selectedPlace: Place | null
  setSelectedPlace: (place: Place | null) => void
  selectedCategories: Set<string>
  onApplyCategories: (categories: Set<string>) => void
  hasFilters: boolean
  onClearFilters: () => void
  onBack: () => void
}) {
  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header — full width */}
      <motion.div
        className="z-20"
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

      {/* Main content: side panel + map */}
      <div className="flex min-h-0 flex-1">
        {/* Side panel */}
        <div className="flex w-[400px] shrink-0 flex-col border-r border-border/40">
          <AnimatePresence mode="wait">
            {selectedPlace ? (
              <motion.div
                key="detail"
                className="min-h-0 flex-1 overflow-y-auto"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <PlaceDetailContent
                  place={selectedPlace}
                  driveTimes={data.driveTimes[selectedPlace.id]}
                  origins={data.origins}
                  onBack={() => setSelectedPlace(null)}
                  defaultExpanded
                />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                className="min-h-0 flex-1 overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="px-5 pt-5 pb-8">
                  {filteredPlaces.length === 0 ? (
                    <EmptyState
                      hasFilters={hasFilters}
                      onClearFilters={onClearFilters}
                      onBack={onBack}
                    />
                  ) : (
                    <>
                      {/* Section header */}
                      <div className="mb-5 flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-foreground">
                            places to meet
                          </h2>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {filteredPlaces.length} spots found nearby
                          </p>
                        </div>
                        <CategoryFilter
                          selected={selectedCategories}
                          onApply={onApplyCategories}
                        />
                      </div>

                      {/* Place cards */}
                      <div className="grid gap-4">
                        {filteredPlaces.map((place, index) => (
                          <motion.div
                            key={place.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.35,
                              ease: [0.22, 1, 0.36, 1],
                              delay: 0.1 + index * 0.05,
                            }}
                          >
                            <PlaceCard
                              place={place}
                              driveTimes={data.driveTimes[place.id]}
                              onSelect={() => setSelectedPlace(place)}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Map — fills remaining space */}
        <motion.div
          className="relative min-h-0 flex-1"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ""}>
            <MiniMap
              coordinates={data.coordinates}
              midpoint={data.midpoint}
              places={filteredPlaces}
              isExpanded={false}
              onToggleExpand={() => {}}
              onPlaceSelect={setSelectedPlace}
              className="h-full"
              hideToggle
            />
          </APIProvider>
        </motion.div>
      </div>
    </motion.div>
  )
}

/** Shared empty state for both mobile and desktop */
function EmptyState({
  hasFilters,
  onClearFilters,
  onBack,
}: {
  hasFilters: boolean
  onClearFilters: () => void
  onBack: () => void
}) {
  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <SearchX className="size-7 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">
          {hasFilters ? "no places match your filters" : "no places found"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasFilters
            ? "try removing some category filters or clearing them all."
            : "we couldn\u2019t find any places to meet in this area. try different addresses or locations that are closer together."}
        </p>
      </div>
      {hasFilters ? (
        <div className="mt-2 flex flex-col items-center gap-2">
          <Button variant="outline" onClick={onClearFilters}>
            clear filters
          </Button>
          <button
            className="text-sm text-muted-foreground underline underline-offset-2"
            onClick={onBack}
          >
            try different addresses
          </button>
        </div>
      ) : (
        <Button variant="outline" className="mt-2" onClick={onBack}>
          try different addresses
        </Button>
      )}
    </motion.div>
  )
}
