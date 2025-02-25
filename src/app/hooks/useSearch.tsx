import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";

const useSearch = () =>
  useMutation({
    mutationKey: ["findPlaces"],
    mutationFn: async (placeIds: string[]) => {
      const res = await client.maps.search.$get({
        inputs: placeIds,
      });
      const data = await res.json();
      return data;
    },
  });
export default useSearch;
