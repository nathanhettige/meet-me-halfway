import { publicProcedure } from "@/server/jstack";
import { z } from "zod";
import calculateMidpoint from "./calculateMidpoint";
import fetchPlaceDetails from "./fetchPlaceDetails";
import fetchSearchNearby from "./fetchSearchNearby";
import fetchRouteMatrix from "./fetchRouteMatrix";

// Example (Conceptual - with Directions API):

//     Person A: Address -> Geocoding API -> Lat/Lng A
//     Person B: Address -> Geocoding API -> Lat/Lng B
//     Initial Center: (Lat A + Lat B) / 2, (Lng A + Lng B) / 2
//     Directions API: Get routes from Lat/Lng A and Lat/Lng B to the initial center.
//     Calculate actual travel times from the Directions API results.
//     Adjust the center based on the travel times (e.g., shift it towards the person with the longer time).
//     Repeat steps 4-6 until the center converges.
//     Places API: Search for cafes near the refined center.
//     Directions API: Get routes from Lat/Lng A and Lat/Lng B to each cafe.
//     Calculate travel times and scores for each cafe.
//     Display results on the map.

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type IterationResult = {
  midpoint: Coordinates;
  timeDifference: number;
  percentageDiff: number;
  isBest: boolean;
  iteration: number;
};

const handler = publicProcedure
  .input(z.object({ inputs: z.array(z.string()) }))
  .query(async ({ c, input }) => {
    const coordinates: Coordinates[] = [];
    const iterations: IterationResult[] = [];
    let bestIterationNumber = 1;

    for (const placeId of input.inputs) {
      const data = await fetchPlaceDetails(placeId);
      coordinates.push({
        latitude: data.location.latitude,
        longitude: data.location.longitude,
      });
    }

    let currentMidpoint = calculateMidpoint(coordinates);
    let bestMidpoint = currentMidpoint;
    let minTimeDifference = Infinity;
    const MAX_ITERATIONS = 10;
    const MAX_TIME_DIFF_SECONDS = 120; // 2 minutes
    const MAX_PERCENTAGE_DIFF = 5; // 5%

    // Iteratively search for better midpoint
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const places = await fetchSearchNearby(currentMidpoint);
      if (places.length === 0) continue;

      const routes = await fetchRouteMatrix(input.inputs, places[0]!.id);
      const travelTimes = input.inputs.map((_, index) =>
        parseInt(
          routes
            .find((x) => x.originIndex === index)
            ?.duration?.replace("s", "") || "0"
        )
      );

      const maxTime = Math.max(...travelTimes);
      const minTime = Math.min(...travelTimes);
      const timeDifference = maxTime - minTime;
      const percentageDiff = ((maxTime - minTime) / minTime) * 100;

      console.log(
        `Iteration ${i + 1}: Time diff: ${Math.floor(timeDifference / 60)}m ${
          timeDifference % 60
        }s (${percentageDiff.toFixed(2)}%)`
      );

      iterations.push({
        midpoint: { ...currentMidpoint },
        timeDifference,
        percentageDiff,
        isBest: false,
        iteration: i + 1,
      });

      // Stop if we've reached acceptable thresholds
      if (
        timeDifference <= MAX_TIME_DIFF_SECONDS ||
        percentageDiff <= MAX_PERCENTAGE_DIFF
      ) {
        bestMidpoint = currentMidpoint;
        bestIterationNumber = i + 1;
        break;
      }

      // If we found a better midpoint, save it
      if (timeDifference < minTimeDifference) {
        minTimeDifference = timeDifference;
        bestMidpoint = currentMidpoint;
        bestIterationNumber = i + 1;
      }

      // Adjust midpoint towards the location with longer travel time
      const maxTimeIndex = travelTimes.indexOf(maxTime);
      currentMidpoint = {
        latitude:
          (currentMidpoint.latitude * (1 + percentageDiff / 100) +
            coordinates[maxTimeIndex]!.latitude) /
          (2 + percentageDiff / 100),
        longitude:
          (currentMidpoint.longitude * (1 + percentageDiff / 100) +
            coordinates[maxTimeIndex]!.longitude) /
          (2 + percentageDiff / 100),
      };
    }

    // Mark the best iteration at the end
    const bestIteration = iterations.find(
      (iter) => iter.iteration === bestIterationNumber
    );
    if (bestIteration) {
      bestIteration.isBest = true;
    }

    // Use the best midpoint found for final search
    const finalPlaces = await fetchSearchNearby(bestMidpoint);

    return c.superjson({
      coordinates: coordinates,
      midpoint: bestMidpoint,
      places: finalPlaces,
      iterations: iterations,
      performance: {
        iterations: bestIterationNumber,
        timeDifference: minTimeDifference,
        percentageDiff: Math.min(...iterations.map((i) => i.percentageDiff)),
      },
    });
  });

export default handler;
