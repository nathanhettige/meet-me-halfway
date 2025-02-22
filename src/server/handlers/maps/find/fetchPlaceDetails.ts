const fetchPlaceDetails = async (placeId: string) => {
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

  return data;
};

export default fetchPlaceDetails;
