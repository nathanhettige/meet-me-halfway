import { Coordinates } from ".";

const fetchNearbyCities = async (coordinates: Coordinates) => {
  const places = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.MAPS_API_KEY as string,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.types,places.location",
      },
      body: JSON.stringify({
        includedTypes: ["locality"],
        maxResultCount: 5,
        locationRestriction: {
          circle: {
            center: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            },
            radius: 50000, // 50km
          },
        },
        rankPreference: "DISTANCE",
      }),
    }
  );

  const data = (await places.json()) as {
    places?: Array<{
      displayName: {
        text: string;
      };
      formattedAddress: string;
      types: string[];
      location: {
        latitude: number;
        longitude: number;
      };
    }>;
  };

  return data.places ?? [];
};

export default fetchNearbyCities;
