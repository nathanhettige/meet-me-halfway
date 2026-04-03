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

      <main className="flex-1 px-4 pb-6 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {data.places.length} spots found
          </h2>
        </div>

        <div className="grid gap-3">
          {data.places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onSelect={() => setSelectedPlace(place)}
            />
          ))}
        </div>
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
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-1 h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <Skeleton className="h-32 w-full" />

      <div className="flex-1 px-4 py-4">
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="grid gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
