"use client";

import { useState } from "react";
import { AutoComplete } from "./components/autocomplete";
import { CardContent, CardFooter } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { useRouter } from "next/navigation";

const useFindPlaces = () => {
  const router = useRouter();
  return useMutation({
    mutationKey: ["findPlaces"],
    mutationFn: async (placeIds: string[]) => {
      const res = await client.maps.find.$get({
        inputs: placeIds,
      });
      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      router.push("/places");
    },
  });
};

const Search = () => {
  const findMidpoint = useFindPlaces();
  const [placeIds, setPlaceIds] = useState<string[]>(["", "", ""]);

  const handleChange = (index: number, value: string) => {
    setPlaceIds((prev) => {
      const newLocations = [...prev];
      newLocations[index] = value;
      return newLocations;
    });
  };

  const onSubmit = () => {
    findMidpoint.mutate(placeIds);
  };

  return (
    <>
      <CardContent className="space-y-2">
        {placeIds.map((l, idx) => (
          <AutoComplete
            key={idx}
            placeholder={`Enter an address`}
            setPlaceId={(value) => handleChange(idx, value)}
          />
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={onSubmit}>Find a place to meet</Button>
      </CardFooter>
    </>
  );
};

export default Search;
