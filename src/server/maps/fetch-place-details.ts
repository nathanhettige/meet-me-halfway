export async function fetchPlaceDetails(
  placeId: string,
  sessionToken?: string
) {
  const url = new URL(
    `https://places.googleapis.com/v1/places/${placeId}`
  )
  if (sessionToken) {
    url.searchParams.set("sessionToken", sessionToken)
  }

  const response = await fetch(url.toString(), {
    headers: {
      "X-Goog-Api-Key": process.env.MAPS_API_KEY!,
      "X-Goog-FieldMask": "location,displayName",
    },
  })

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
    displayName: {
      text: string
    }
  }

  return data
}
