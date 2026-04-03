import { useEffect } from "react"
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps"
import { ChevronDown, ChevronUp, Home, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Coordinates, Place } from "@/server/maps/types"
import { cn } from "@/lib/utils"

type MiniMapProps = {
  coordinates: Array<Coordinates>
  midpoint: Coordinates
  places: Array<Place>
  isExpanded: boolean
  onToggleExpand: () => void
  onPlaceSelect: (place: Place) => void
}

export function MiniMap({
  coordinates,
  midpoint,
  places,
  isExpanded,
  onToggleExpand,
}: MiniMapProps) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    if (coordinates.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      ;[...coordinates, midpoint].forEach((coord) => {
        bounds.extend({ lat: coord.latitude, lng: coord.longitude })
      })
      map.fitBounds(bounds, { top: 20, bottom: 20, left: 20, right: 20 })
    }
  }, [map, coordinates, midpoint])

  return (
    <div className="relative">
      <div
        className={cn(
          "w-full overflow-hidden transition-all duration-300",
          isExpanded ? "h-72" : "h-32"
        )}
      >
        <Map
          mapId="results-mini-map"
          colorScheme="FOLLOW_SYSTEM"
          defaultZoom={12}
          defaultCenter={{ lat: midpoint.latitude, lng: midpoint.longitude }}
          gestureHandling="cooperative"
          disableDefaultUI={true}
          className="h-full w-full"
        >
          {/* Origin markers */}
          {coordinates.map((coord, index) => (
            <AdvancedMarker
              key={`origin-${index}`}
              position={{ lat: coord.latitude, lng: coord.longitude }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-red-500 shadow-lg">
                <Home className="h-4 w-4 text-white" />
              </div>
            </AdvancedMarker>
          ))}

          {/* Midpoint marker */}
          <AdvancedMarker
            position={{ lat: midpoint.latitude, lng: midpoint.longitude }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary shadow-lg">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
          </AdvancedMarker>
        </Map>
      </div>

      {/* Expand/collapse button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onToggleExpand}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 gap-1 rounded-full px-3 py-1 text-xs shadow-md"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3" />
            <span>Less</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            <span>More</span>
          </>
        )}
      </Button>

      {/* Place count badge */}
      <div className="absolute right-3 top-3 rounded-full bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
        {places.length} spots nearby
      </div>
    </div>
  )
}
