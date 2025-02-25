"use client";

import { InferOutput } from "@/server";
import { useMutationState } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@ui/card";
import MarkerMap from "../components/markerMap";

const Places = () => {
  const router = useRouter();
  const data = useMutationState({
    filters: {
      mutationKey: ["findPlaces"],
    },
    select: (mutation) => mutation.state.data,
  });

  const latest = data[data.length - 1] as InferOutput["maps"]["find"];

  useEffect(() => {
    if (!latest) {
      router.push("/");
    }
  }, [latest, router]);

  if (!latest) {
    return null;
  }

  const iterations = latest.iterations.map((iter) => iter.midpoint);

  return (
    <div className="grid grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-4 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Search Performance</CardTitle>
            <CardDescription>
              How we found your perfect midpoint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Iterations Required:</span>
              <span className="text-sm">{latest.performance.iterations}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Travel Time Difference:
              </span>
              <span className="text-sm">
                {Math.floor(latest.performance.timeDifference / 60)}m{" "}
                {latest.performance.timeDifference % 60}s
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Time Difference %:</span>
              <span className="text-sm">
                {latest.performance.percentageDiff.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
        {latest.places.map((place) => (
          <Card key={place.id} className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{place.displayName.text}</CardTitle>
              <CardDescription>{place.formattedAddress}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Rating: {place.rating} ⭐</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <MarkerMap
        coordinates={latest.coordinates}
        midpoint={latest.midpoint}
        iterations={iterations}
      />
    </div>
  );
};

export default Places;
