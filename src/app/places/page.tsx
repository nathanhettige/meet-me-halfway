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

  return (
    <div className="flex flex-col items-center gap-4 p-4">
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
  );
};

export default Places;
