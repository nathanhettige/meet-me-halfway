export async function fetchPlaceDetails(placeId: string) {
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      headers: {
        "X-Goog-Api-Key": process.env.MAPS_API_KEY!,
        "X-Goog-FieldMask": "location",
      },
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Place details request failed for ${placeId} (${response.status}): ${errorBody}`
    )
  }

  const data = (await response.json()) as {
    location: {
      longitude: number
      latitude: number
    }
  }

  return data
}
