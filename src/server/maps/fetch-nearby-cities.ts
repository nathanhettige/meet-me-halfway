import type { Coordinates } from "./types"

type CityResult = {
  displayName: { text: string }
  formattedAddress: string
  types: Array<string>
  location: Coordinates
}

export async function fetchNearbyCities(
  coordinates: Coordinates
): Promise<Array<CityResult>> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.MAPS_API_KEY!,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.types,places.location",
      },
      body: JSON.stringify({
        includedTypes: ["locality"],
        maxResultCount: 5,
        locationRestriction: {
          circle: {
            center: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            },
            radius: 50000,
          },
        },
        rankPreference: "DISTANCE",
      }),
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Nearby cities search failed (${response.status}): ${errorBody}`
    )
  }

  const data = (await response.json()) as {
    places?: Array<CityResult>
  }

  return data.places ?? []
}
