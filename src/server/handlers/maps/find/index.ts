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

const handler = publicProcedure
  .input(z.object({ inputs: z.array(z.string()) }))
  .query(async ({ c, input }) => {
    const coordinates: Coordinates[] = [];

    for (const placeId of input.inputs) {
      const data = await fetchPlaceDetails(placeId);

      coordinates.push({
        latitude: data.location.latitude,
        longitude: data.location.longitude,
      });
    }

    const midpoint = calculateMidpoint(coordinates);

    const places = await fetchSearchNearby(midpoint);

    if (places.length === 0)
      // Return markers for debugging purposes
      return c.superjson({
        coordinates: coordinates,
        midpoint: midpoint,
        places: [],
      });

    const bestPlace = places[0]!;

    // See the driving time to each place and adjust midpoint
    const routes = await fetchRouteMatrix(input.inputs, bestPlace.id);

    const travelData = input.inputs.map((id, index) => ({
      id,
      travelTime: routes.find((x) => x.originIndex === index)?.duration,
    }));

    // Convert duration strings (like "1234s") to numbers by removing 's' and parsing
    const travelTimes = travelData.map((data) =>
      parseInt(data.travelTime?.replace("s", "") || "0")
    );

    // Calculate percentage difference between travel times
    const maxTime = Math.max(...travelTimes);
    const minTime = Math.min(...travelTimes);
    const percentageDiff = ((maxTime - minTime) / minTime) * 100;
    const diff = maxTime - minTime;

    console.log(
      `Travel time difference: ${percentageDiff.toFixed(2)}% - ${Math.floor(
        diff / 60
      )}m ${diff % 60}s`
    );
    console.log(travelData);

    return c.superjson({
      coordinates: coordinates,
      midpoint: midpoint,
      places: places,
    });
  });

export default handler;
