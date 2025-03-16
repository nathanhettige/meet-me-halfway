"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@ui/card";
import MarkerMap from "../components/markerMap";
import useSearch from "../hooks/useSearch";
import { Spinner } from "../components/ui/spinner";
import { ScrollArea } from "../components/ui/scroll-area";
import { APIProvider } from "@vis.gl/react-google-maps";

const Places = () => {
  const searchParams = useSearchParams();
  const search = useSearch(searchParams.get("placeIds")?.split(",") || []);
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("placeIds") === null) {
      router.push("/");
    }
  }, [searchParams, router]);

  if (!search.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const iterations = search.data.iterations.map((iter) => iter.midpoint);

  return (
    <div className="grid grid-cols-[auto_1fr]">
      <ScrollArea className="w-full h-screen overscroll-none">
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
                <span className="text-sm">{search.data.iterations.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Found on Iteration:</span>
                <span className="text-sm">
                  {search.data.performance.foundOnIteration}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Travel Time Difference:
                </span>
                <span className="text-sm">
                  {Math.floor(search.data.performance.timeDifference / 60)}m{" "}
                  {search.data.performance.timeDifference % 60}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Time Difference %:</span>
                <span className="text-sm">
                  {search.data.performance.percentageDiff.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
          {search.data.places.map((place) => (
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
      </ScrollArea>

      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <MarkerMap
          coordinates={search.data.coordinates}
          midpoint={search.data.midpoint}
          iterations={iterations}
        />
      </APIProvider>
    </div>
  );
};

export default Places;
