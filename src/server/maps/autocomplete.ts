import { createServerFn } from "@tanstack/react-start"

export const autocomplete = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const data = input as { input: string }
    if (!data.input || typeof data.input !== "string") {
      throw new Error("input is required")
    }
    return data
  })
  .handler(async ({ data }) => {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.MAPS_API_KEY!,
          "X-Goog-FieldMask":
            "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
        },
        body: JSON.stringify({
          input: data.input,
        }),
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `Autocomplete request failed (${response.status}): ${errorBody}`
      )
    }

    const result = (await response.json()) as {
      suggestions?: Array<{
        placePrediction: { placeId: string; text: { text: string } }
      }>
    }

    return (result.suggestions ?? []).map((suggestion) => ({
      value: suggestion.placePrediction.placeId,
      label: suggestion.placePrediction.text.text,
    }))
  })
