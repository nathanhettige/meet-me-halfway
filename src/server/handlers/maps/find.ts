import { publicProcedure } from "@/server/jstack";
import { z } from "zod";

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

const handler = publicProcedure
  .input(z.object({ inputs: z.array(z.string()) }))
  .query(async ({ c, input }) => {
    return c.superjson({ hello: input });
  });

export default handler;
