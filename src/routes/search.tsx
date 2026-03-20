import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { APIProvider } from "@vis.gl/react-google-maps"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MarkerMap } from "@/components/marker-map"
import { useSearch } from "@/hooks/use-maps"
import { Skeleton } from "@/components/ui/skeleton"

type SearchParams = {
  placeIds: string
}

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    placeIds: (search.placeIds as string) || "",
  }),
  component: SearchPage,
})

function SearchPage() {
  const { placeIds: placeIdsParam } = Route.useSearch()
  const placeIds = placeIdsParam ? placeIdsParam.split(",") : []
  const searchResult = useSearch(placeIds)
  const navigate = useNavigate()

  useEffect(() => {
    if (!placeIdsParam) {
      navigate({ to: "/" })
    }
  }, [placeIdsParam, navigate])

  if (!searchResult.data) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <p className="text-sm text-muted-foreground">
            Finding your perfect midpoint...
          </p>
        </div>
      </div>
    )
  }

  const { data } = searchResult
  const iterations = data.iterations

  return (
    <div className="grid h-svh grid-cols-[auto_1fr]">
      <ScrollArea className="h-svh w-full overscroll-none">
        <div className="flex flex-col items-center gap-4 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Search Performance</CardTitle>
              <CardDescription>
                How we found your perfect midpoint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Iterations Required:
                </span>
                <span className="text-sm">{data.iterations.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Found on Iteration:
                </span>
                <span className="text-sm">
                  {data.performance.foundOnIteration}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Travel Time Difference:
                </span>
                <span className="text-sm">
                  {Math.floor(data.performance.timeDifference / 60)}m{" "}
                  {data.performance.timeDifference % 60}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Time Difference %:
                </span>
                <span className="text-sm">
                  {data.performance.percentageDiff.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {data.places.map((place) => (
            <Card key={place.id} className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{place.displayName.text}</CardTitle>
                <CardDescription>{place.formattedAddress}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Rating: {place.rating} ⭐</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <APIProvider
        apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ""}
      >
        <MarkerMap
          coordinates={data.coordinates}
          midpoint={data.midpoint}
          iterations={iterations}
        />
      </APIProvider>
    </div>
  )
}
