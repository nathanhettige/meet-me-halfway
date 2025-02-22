import { Coordinates } from ".";

const fetchSearchNearby = async (coordinates: Coordinates) => {
  const places = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.MAPS_API_KEY as string,
        "X-Goog-FieldMask":
          "places.id,places.displayName.text,places.formattedAddress,places.rating,places.googleMapsUri,places.websiteUri,places.currentOpeningHours.weekdayDescriptions,places.types",
      },
      body: JSON.stringify({
        includedTypes: [
          "restaurant",
          "cafe",
          "bar",
          "bakery",
          "shopping_mall",
          "movie_theater",
          "museum",
          "art_gallery",
          "amusement_park",
          "night_club",
          "tourist_attraction",
          "bowling_alley",
        ],
        locationRestriction: {
          circle: {
            center: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            },
            radius: 1000.0, // 1km
          },
        },
      }),
    }
  );

  const data = (await places.json()) as {
    places?: Array<{
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
      types: string[];
    }>;
  };

  return data.places ?? [];
};

export default fetchSearchNearby;
