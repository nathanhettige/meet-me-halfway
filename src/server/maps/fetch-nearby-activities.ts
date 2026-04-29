import type { Coordinates, MinimalPlace, Place } from "./types"

const FULL_FIELD_MASK =
  "places.id,places.displayName.text,places.formattedAddress,places.addressComponents,places.location,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.currentOpeningHours.openNow,places.currentOpeningHours.weekdayDescriptions,places.types,places.photos,places.priceLevel,places.businessStatus,places.editorialSummary,places.reviews"

const MINIMAL_FIELD_MASK =
  "places.id,places.displayName.text,places.location,places.businessStatus"

const DEFAULT_RADIUS_METERS = 25000.0

export async function fetchNearbyActivities(
  coordinates: Coordinates,
  maxResults: number,
  minimal: true,
  radiusMeters?: number
): Promise<Array<MinimalPlace>>
export async function fetchNearbyActivities(
  coordinates: Coordinates,
  maxResults?: number,
  minimal?: false,
  radiusMeters?: number
): Promise<Array<Place>>
export async function fetchNearbyActivities(
  coordinates: Coordinates,
  maxResults = 20,
  minimal = false,
  radiusMeters = DEFAULT_RADIUS_METERS
): Promise<Array<Place> | Array<MinimalPlace>> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.MAPS_API_KEY!,
        "X-Goog-FieldMask": minimal ? MINIMAL_FIELD_MASK : FULL_FIELD_MASK,
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
          "sports_complex",
          "park",
          "spa",
          "gym",
          "zoo",
          "aquarium",
          "library",
          "casino",
          "ice_skating_rink",
          "dog_park",
          "playground",
        ],
        maxResultCount: maxResults,
        locationRestriction: {
          circle: {
            center: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            },
            radius: radiusMeters,
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

  if (minimal) {
    const data = (await response.json()) as {
      places?: Array<MinimalPlace>
    }
    const places = data.places ?? []
    return places.filter(
      (p) =>
        p.businessStatus !== "CLOSED_TEMPORARILY" &&
        p.businessStatus !== "CLOSED_PERMANENTLY"
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
