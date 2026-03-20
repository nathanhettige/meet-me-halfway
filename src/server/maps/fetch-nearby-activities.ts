import type { Coordinates, Place } from "./types"

export async function fetchNearbyActivities(
  coordinates: Coordinates
): Promise<Array<Place>> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.MAPS_API_KEY!,
        "X-Goog-FieldMask":
          "places.id,places.displayName.text,places.formattedAddress,places.rating,places.googleMapsUri,places.websiteUri,places.currentOpeningHours.weekdayDescriptions,places.types",
      },
      body: JSON.stringify({
        includedTypes: [
          "restaurant",
          "cafe",
          "bar",
          "bakery",
          "shopping_mall",
          "movie_theater",
          "museum",
          "art_gallery",
          "amusement_park",
          "night_club",
          "tourist_attraction",
          "bowling_alley",
        ],
        locationRestriction: {
          circle: {
            center: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            },
            radius: 25000.0,
          },
        },
        rankPreference: "DISTANCE",
      }),
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Nearby activities search failed (${response.status}): ${errorBody}`
    )
  }

  const data = (await response.json()) as {
    places?: Array<Place>
  }

  return data.places ?? []
}
