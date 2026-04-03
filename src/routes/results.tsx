import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { APIProvider } from "@vis.gl/react-google-maps"
import { useSearch } from "@/hooks/use-maps"
import { Skeleton } from "@/components/ui/skeleton"
import { ResultsHeader } from "@/components/results/results-header"
import { MiniMap } from "@/components/results/mini-map"
import { PlaceCard } from "@/components/results/place-card"
import { PlaceDetailSheet } from "@/components/results/place-detail-sheet"
import type { Place } from "@/server/maps/types"

type SearchParams = {
  placeIds: string
}

export const Route = createFileRoute("/results")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    placeIds: (search.placeIds as string) || "",
  }),
  component: ResultsPage,
})

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

  if (!searchResult.data) {
    return <ResultsLoadingSkeleton />
  }

  const { data } = searchResult
  const cityName = data.snap?.cityName || "Midpoint"

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <ResultsHeader
        cityName={cityName}
        placeCount={data.places.length}
        onBack={() => navigate({ to: "/" })}
      />

      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ""}>
        <MiniMap
          coordinates={data.coordinates}
          midpoint={data.midpoint}
          places={data.places}
          isExpanded={isMapExpanded}
          onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
          onPlaceSelect={setSelectedPlace}
        />
      </APIProvider>

      <main className="flex-1 px-4 pb-8 pt-5">
        {/* Section header */}
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Places to meet
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {data.places.length} spots found nearby
            </p>
          </div>
        </div>

        {/* Place cards */}
        <div className="grid gap-3">
          {data.places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onSelect={() => setSelectedPlace(place)}
            />
          ))}
        </div>

        {/* Bottom safe area padding */}
        <div className="h-6" />
      </main>

      <PlaceDetailSheet
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
      />
    </div>
  )
}

function ResultsLoadingSkeleton() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="mb-1.5 h-5 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Map skeleton */}
      <div className="mx-4 mt-2">
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 px-4 pt-5">
        <Skeleton className="mb-1.5 h-6 w-36" />
        <Skeleton className="mb-4 h-4 w-28" />

        <div className="grid gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-card p-4 ring-1 ring-border/50"
            >
              <Skeleton className="mb-2 h-4 w-16 rounded-full" />
              <Skeleton className="mb-2 h-5 w-3/4" />
              <Skeleton className="mb-2.5 h-4 w-1/2" />
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Skeleton key={s} className="h-4 w-4 rounded-sm" />
                ))}
                <Skeleton className="ml-1 h-4 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
