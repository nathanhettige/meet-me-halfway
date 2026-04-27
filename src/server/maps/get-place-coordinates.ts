import { createServerFn } from "@tanstack/react-start"
import type { Coordinates } from "@/server/maps/types"
import { fetchPlaceDetails } from "@/server/maps/fetch-place-details"

export const getPlaceCoordinates = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const data = input as { placeId: string; sessionToken?: string }
    if (!data.placeId || typeof data.placeId !== "string") {
      throw new Error("placeId is required")
    }
    return data
  })
  .handler(async ({ data }): Promise<Coordinates> => {
    const result = await fetchPlaceDetails(data.placeId, data.sessionToken)
    return result.location
  })
