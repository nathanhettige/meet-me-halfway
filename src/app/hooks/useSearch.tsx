import { client } from "@/lib/client";
import { useQuery } from "@tanstack/react-query";

const useSearch = (placeIds: string[]) =>
  useQuery({
    enabled: placeIds.length > 0,
    queryKey: ["findPlaces", placeIds],
    queryFn: async () => {
      const res = await client.maps.search.$get({
        inputs: placeIds,
      });
      const data = await res.json();
      return data;
    },
  });
export default useSearch;
