import { useEffect } from "react"
import { AdvancedMarker, Map, Pin, useMap } from "@vis.gl/react-google-maps"
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
      className="h-screen w-full"
    >
      {coordinates.map((coord, index) => (
        <AdvancedMarker
          key={`coord-${index}`}
          position={{ lat: coord.latitude, lng: coord.longitude }}
        >
          <Pin scale={1.25} glyphColor="#A71010">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5"
            >
              <path
                fillRule="evenodd"
                d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
                clipRule="evenodd"
              />
            </svg>
          </Pin>
        </AdvancedMarker>
      ))}

      <AdvancedMarker
        position={{ lat: midpoint.latitude, lng: midpoint.longitude }}
      />

      {iterations.map((iter) => (
        <AdvancedMarker
          key={`iter-${iter.iteration}`}
          position={{ lat: iter.midpoint.latitude, lng: iter.midpoint.longitude }}
        >
          <div className="flex size-6 items-center justify-center rounded-full border border-white bg-green-500 text-xs font-bold text-black">
            {iter.iteration}
          </div>
        </AdvancedMarker>
      ))}
    </Map>
  )
}
