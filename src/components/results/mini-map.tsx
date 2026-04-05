import { useEffect } from "react"
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps"
import {
  ChevronDown,
  ChevronUp,
  Home,
  Map as MapIcon,
  MapPin,
} from "lucide-react"
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
  onPlaceSelect,
}: MiniMapProps) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    if (coordinates.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      ;[...coordinates, midpoint].forEach((coord) => {
        bounds.extend({ lat: coord.latitude, lng: coord.longitude })
      })
      places.forEach((place) => {
        bounds.extend({
          lat: place.location.latitude,
          lng: place.location.longitude,
        })
      })
      map.fitBounds(bounds, { top: 20, bottom: 20, left: 20, right: 20 })
    }
  }, [map, coordinates, midpoint, places])

  return (
    <div className="relative mx-4 mt-2 overflow-hidden rounded-2xl ring-1 ring-border/50">
      <div
        className={cn(
          "w-full overflow-hidden transition-all duration-700 ease-out",
          isExpanded ? "h-64" : "h-28"
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
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-700 shadow-lg">
                <Home className="h-3.5 w-3.5 text-white" />
              </div>
            </AdvancedMarker>
          ))}

          {/* Midpoint marker */}
          <AdvancedMarker
            position={{ lat: midpoint.latitude, lng: midpoint.longitude }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-sky-blue shadow-lg">
              <MapPin className="h-4 w-4 text-white" />
            </div>
          </AdvancedMarker>

          {/* Place markers */}
          {places.map((place) => (
            <AdvancedMarker
              key={`place-${place.id}`}
              position={{
                lat: place.location.latitude,
                lng: place.location.longitude,
              }}
              onClick={() => onPlaceSelect(place)}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-sky-blue/70 shadow-md transition-transform hover:scale-110">
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </div>

      {/* Top info bar */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-background/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
        <MapIcon className="h-3 w-3 text-sky-blue" />
        <span>{coordinates.length} starting points</span>
      </div>

      {/* Expand/collapse toggle */}
      <button
        onClick={onToggleExpand}
        className="absolute right-0 bottom-0 left-0 flex items-center justify-center gap-1 bg-gradient-to-t from-background/95 via-background/80 to-transparent py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            <span>Collapse map</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            <span>Expand map</span>
          </>
        )}
      </button>
    </div>
  )
}
