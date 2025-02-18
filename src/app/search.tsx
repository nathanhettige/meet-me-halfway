"use client";

import { useState } from "react";
import { AutoComplete } from "./components/autocomplete";
import { CardContent, CardFooter } from "./components/ui/card";
import { Button } from "./components/ui/button";

const Search = () => {
  const [placeIds, setPlaceIds] = useState<string[]>(["", ""]);

  const handleChange = (index: number, value: string) => {
    setPlaceIds((prev) => {
      const newLocations = [...prev];
      newLocations[index] = value;
      return newLocations;
    });
  };

  const onSubmit = () => {
    console.log(placeIds);
  };

  return (
    <>
      <CardContent>
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
