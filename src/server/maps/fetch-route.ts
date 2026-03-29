import type { Coordinates } from "./types"

type RouteResult = {
  encodedPolyline: string
  durationSeconds: number
  distanceMeters: number
}

function stripPlacesPrefix(id: string): string {
  return id.startsWith("places/") ? id.slice(7) : id
}

export async function fetchRoute(
  originPlaceId: string,
  destination: Coordinates
): Promise<RouteResult> {
  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.MAPS_API_KEY!,
        "X-Goog-FieldMask":
          "routes.polyline.encodedPolyline,routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: {
          placeId: stripPlacesPrefix(originPlaceId),
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
          },
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
      }),
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Route request failed (${response.status}): ${errorBody}`)
  }

  const data = (await response.json()) as {
    routes: Array<{
      polyline: { encodedPolyline: string }
      duration: string
      distanceMeters: number
    }>
  }

  const route = data.routes[0]
  return {
    encodedPolyline: route.polyline.encodedPolyline,
    durationSeconds: parseInt(route.duration.replace("s", "")),
    distanceMeters: route.distanceMeters,
  }
}
