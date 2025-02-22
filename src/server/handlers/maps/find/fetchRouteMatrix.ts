const fetchRouteMatrix = async (
  originPlaceIds: string[],
  destinationPlaceId: string
) => {
  const routes = await fetch(
    "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.MAPS_API_KEY!,
        "X-Goog-FieldMask": "*",
      },
      body: JSON.stringify({
        origins: originPlaceIds.map((originPlaceId) => ({
          waypoint: {
            placeId: originPlaceId,
          },
        })),
        destinations: [
          {
            waypoint: {
              placeId: destinationPlaceId,
            },
          },
        ],
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
      }),
    }
  );

  const data = (await routes.json()) as {
    originIndex: number;
    destinationIndex: number;
    distanceMeters: number;
    duration: string;
    condition: string;
    status: Record<string, never>;
  }[];

  return data;
};

export default fetchRouteMatrix;
