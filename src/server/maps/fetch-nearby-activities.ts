import type { Coordinates, Place } from "./types"

export async function fetchNearbyActivities(
  coordinates: Coordinates,
  maxResults = 20
): Promise<Array<Place>> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.MAPS_API_KEY!,
        "X-Goog-FieldMask":
          "places.id,places.displayName.text,places.formattedAddress,places.addressComponents,places.location,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.currentOpeningHours.openNow,places.currentOpeningHours.weekdayDescriptions,places.types,places.photos,places.priceLevel,places.businessStatus",
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
        maxResultCount: maxResults,
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

  const places = data.places ?? []

  return places.filter(
    (p) =>
      p.businessStatus !== "CLOSED_TEMPORARILY" &&
      p.businessStatus !== "CLOSED_PERMANENTLY"
  )
}
