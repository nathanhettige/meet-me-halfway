import { createServerFn } from "@tanstack/react-start"

/**
 * Resolves a Google Places photo resource name to an image URL.
 *
 * The Places API (new) returns photo references like "places/ABC/photos/XYZ".
 * Hitting the media endpoint with `skipHttpRedirect=true` returns JSON with
 * the resolved `photoUri` — no redirect chasing needed.
 */
export const fetchPlacePhoto = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const data = input as { photoName: string; maxWidthPx?: number }
    if (!data.photoName || typeof data.photoName !== "string") {
      throw new Error("photoName is required")
    }
    return data
  })
  .handler(async ({ data }) => {
    const { photoName, maxWidthPx = 400 } = data
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&skipHttpRedirect=true`

    const response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": process.env.MAPS_API_KEY!,
      },
    })

    if (!response.ok) {
      throw new Error(
        `Photo fetch failed (${response.status}): ${await response.text()}`
      )
    }

    const result = (await response.json()) as { photoUri: string }
    return result.photoUri
  })
