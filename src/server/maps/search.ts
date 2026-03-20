import { createServerFn } from "@tanstack/react-start"
import { calculateMidpoint } from "./calculate-midpoint"
import { fetchPlaceDetails } from "./fetch-place-details"
import { fetchNearbyActivities } from "./fetch-nearby-activities"
import { fetchRouteMatrix } from "./fetch-route-matrix"
import { fetchNearbyCities } from "./fetch-nearby-cities"
import type { Coordinates, IterationResult, SearchResult } from "./types"

const MAX_ITERATIONS = 10
const MAX_TIME_DIFF_SECONDS = 30
const MAX_PERCENTAGE_DIFF = 5

export const search = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const data = input as { placeIds: Array<string> }
    if (!Array.isArray(data.placeIds) || data.placeIds.length < 2) {
      throw new Error("At least 2 place IDs are required")
    }
    return data
  })
  .handler(async ({ data }): Promise<SearchResult> => {
    const iterations: Array<IterationResult> = []
    let bestIterationIndex = 0

    // Fetch all place details in parallel
    const details = await Promise.all(
      data.placeIds.map((placeId) => fetchPlaceDetails(placeId))
    )
    const coordinates: Array<Coordinates> = details.map((d) => ({
      latitude: d.location.latitude,
      longitude: d.location.longitude,
    }))

    let currentMidpoint = calculateMidpoint(coordinates)
    let bestMidpoint = currentMidpoint
    let minTimeDifference = Infinity

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const places = await fetchNearbyActivities(currentMidpoint)

      if (places.length === 0) {
        console.log(`Iteration ${i + 1}: No places found near midpoint`)

        const cities = await fetchNearbyCities(currentMidpoint)
        if (cities.length > 0) {
          console.log(
            "No places found near midpoint, adjusted to nearby city -",
            cities[0].displayName
          )
          currentMidpoint = cities[0].location
        }

        // Track the fallback iteration so iteration numbers stay consistent
        iterations.push({
          midpoint: { ...currentMidpoint },
          timeDifference: 0,
          percentageDiff: 0,
          isBest: false,
          iteration: i + 1,
        })
        continue
      }

      const routes = await fetchRouteMatrix(data.placeIds, places[0].id)
      const travelTimes = data.placeIds.map((_, index) => {
        const route = routes.find((x) => x.originIndex === index)
        return parseInt(route?.duration.replace("s", "") || "0")
      })

      const maxTime = Math.max(...travelTimes)
      const minTime = Math.min(...travelTimes)
      const timeDifference = maxTime - minTime
      const percentageDiff =
        minTime > 0 ? ((maxTime - minTime) / minTime) * 100 : 0

      console.log(
        `Iteration ${i + 1}: Time diff: ${Math.floor(timeDifference / 60)}m ${timeDifference % 60}s (${percentageDiff.toFixed(2)}%)`
      )

      iterations.push({
        midpoint: { ...currentMidpoint },
        timeDifference,
        percentageDiff,
        isBest: false,
        iteration: i + 1,
      })

      if (
        timeDifference <= MAX_TIME_DIFF_SECONDS ||
        percentageDiff <= MAX_PERCENTAGE_DIFF
      ) {
        bestMidpoint = currentMidpoint
        bestIterationIndex = iterations.length - 1
        break
      }

      if (timeDifference < minTimeDifference) {
        minTimeDifference = timeDifference
        bestMidpoint = currentMidpoint
        bestIterationIndex = iterations.length - 1
      }

      // Shift midpoint toward the person with the longest drive
      const maxTimeIndex = travelTimes.indexOf(maxTime)
      const shiftWeight = percentageDiff / 100
      currentMidpoint = {
        latitude:
          (currentMidpoint.latitude +
            coordinates[maxTimeIndex].latitude * shiftWeight) /
          (1 + shiftWeight),
        longitude:
          (currentMidpoint.longitude +
            coordinates[maxTimeIndex].longitude * shiftWeight) /
          (1 + shiftWeight),
      }
    }

    // Mark the best iteration
    if (iterations[bestIterationIndex]) {
      iterations[bestIterationIndex].isBest = true
    }

    // Use the best midpoint found for final venue search
    const finalPlaces = await fetchNearbyActivities(bestMidpoint)

    return {
      coordinates,
      midpoint: bestMidpoint,
      places: finalPlaces,
      iterations,
      performance: {
        foundOnIteration: iterations[bestIterationIndex]?.iteration ?? 1,
        timeDifference: iterations[bestIterationIndex]?.timeDifference ?? 0,
        percentageDiff: iterations[bestIterationIndex]?.percentageDiff ?? 0,
      },
    }
  })
