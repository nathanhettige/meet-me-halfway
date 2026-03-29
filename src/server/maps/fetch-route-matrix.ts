export type RouteMatrixResult = {
  originIndex: number
  destinationIndex: number
  distanceMeters?: number
  duration?: string
  condition: string
  status: Record<string, never>
}

function stripPlacesPrefix(id: string): string {
  return id.startsWith("places/") ? id.slice(7) : id
}

export async function fetchRouteMatrix(
  originPlaceIds: Array<string>,
  destinationPlaceIds: Array<string>
): Promise<Array<RouteMatrixResult>> {
  const response = await fetch(
    "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.MAPS_API_KEY!,
        "X-Goog-FieldMask":
          "originIndex,destinationIndex,duration,distanceMeters,condition",
      },
      body: JSON.stringify({
        origins: originPlaceIds.map((placeId) => ({
          waypoint: { placeId: stripPlacesPrefix(placeId) },
        })),
        destinations: destinationPlaceIds.map((placeId) => ({
          waypoint: { placeId: stripPlacesPrefix(placeId) },
        })),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
      }),
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Route matrix request failed (${response.status}): ${errorBody}`
    )
  }

  const data = (await response.json()) as Array<RouteMatrixResult>
  return data
}
