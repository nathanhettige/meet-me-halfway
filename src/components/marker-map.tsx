import { useEffect } from "react"
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps"
import { Home } from "lucide-react"
import type { Coordinates, IterationResult } from "@/server/maps/types"

type MarkerMapProps = {
  coordinates: Array<Coordinates>
  midpoint: Coordinates
  iterations: Array<IterationResult>
}

export function MarkerMap({
  coordinates,
  midpoint,
  iterations,
}: MarkerMapProps) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    if (coordinates.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      ;[...coordinates, midpoint].forEach((coord) => {
        bounds.extend({ lat: coord.latitude, lng: coord.longitude })
      })
      map.fitBounds(bounds)
    }
  }, [map, coordinates, midpoint])

  return (
    <Map
      mapId="marker-map"
      colorScheme="FOLLOW_SYSTEM"
      defaultZoom={10}
      defaultCenter={{ lat: midpoint.latitude, lng: midpoint.longitude }}
      gestureHandling="greedy"
      disableDefaultUI={true}
      className="h-full w-full"
    >
      {coordinates.map((coord, index) => (
        <AdvancedMarker
          key={`coord-${index}`}
          position={{ lat: coord.latitude, lng: coord.longitude }}
        >
          <div
            style={{
              background: "#DC2626",
              border: "2px solid #991B1B",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
            }}
          >
            <Home size={16} color="#fff" strokeWidth={2.5} />
          </div>
        </AdvancedMarker>
      ))}

      <AdvancedMarker
        position={{ lat: midpoint.latitude, lng: midpoint.longitude }}
      />

      {iterations.map((iter) => (
        <AdvancedMarker
          key={`iter-${iter.iteration}`}
          position={{
            lat: iter.midpoint.latitude,
            lng: iter.midpoint.longitude,
          }}
        >
          <div className="flex size-6 items-center justify-center rounded-full border border-white bg-green-500 text-xs font-bold text-black">
            {iter.iteration}
          </div>
        </AdvancedMarker>
      ))}
    </Map>
  )
}
