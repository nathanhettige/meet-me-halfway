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

type Coordinates = {
  latitude: number;
  longitude: number;
};

const calculateMidpoint = (coordinates: Coordinates[]) => {
  if (coordinates.length === 0)
    return { latitude: 0, longitude: 0 } as Coordinates;

  // Convert to radians and cartesian coordinates
  const points = coordinates.map(({ longitude: lng, latitude: lat }) => {
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    return {
      x: Math.cos(latRad) * Math.cos(lngRad),
      y: Math.cos(latRad) * Math.sin(lngRad),
      z: Math.sin(latRad),
    };
  });

  // Calculate average of cartesian coordinates
  const sum = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
      z: acc.z + point.z,
    }),
    { x: 0, y: 0, z: 0 }
  );

  const avg = {
    x: sum.x / points.length,
    y: sum.y / points.length,
    z: sum.z / points.length,
  };

  // Convert back to longitude/latitude
  const lng = Math.atan2(avg.y, avg.x);
  const hyp = Math.sqrt(avg.x * avg.x + avg.y * avg.y);
  const lat = Math.atan2(avg.z, hyp);

  return {
    latitude: (lat * 180) / Math.PI,
    longitude: (lng * 180) / Math.PI,
  } as Coordinates;
};

const handler = publicProcedure
  .input(z.object({ inputs: z.array(z.string()) }))
  .query(async ({ c, input }) => {
    const coordinates: Coordinates[] = [];

    for (const placeId of input.inputs) {
      const response = await fetch(
        "https://places.googleapis.com/v1/places/" + placeId,
        {
          headers: {
            "X-Goog-Api-Key": process.env.MAPS_API_KEY as string,
            "X-Goog-FieldMask": "location",
          },
        }
      );

      const data = (await response.json()) as {
        location: {
          longitude: number;
          latitude: number;
        };
      };

      coordinates.push({
        latitude: data.location.latitude,
        longitude: data.location.longitude,
      });
    }

    const midpoint = calculateMidpoint(coordinates);

    const places = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.MAPS_API_KEY as string,
          "X-Goog-FieldMask":
            "places.id,places.displayName.text,places.formattedAddress,places.rating,places.googleMapsUri,places.websiteUri,places.currentOpeningHours.weekdayDescriptions",
        },
        body: JSON.stringify({
          locationRestriction: {
            circle: {
              center: {
                latitude: midpoint.latitude,
                longitude: midpoint.longitude,
              },
              radius: 500.0, // 500 meters
            },
          },
        }),
      }
    );

    const placesData = (await places.json()) as {
      places: Array<{
        id: string;
        formattedAddress: string;
        rating: number;
        googleMapsUri: string;
        websiteUri: string;
        displayName: {
          text: string;
        };
        currentOpeningHours: {
          weekdayDescriptions: string[];
        };
      }>;
    };

    return c.superjson(placesData);
  });

export default handler;
