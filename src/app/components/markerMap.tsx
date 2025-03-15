import React from "react";
import { Coordinates } from "@/server/handlers/maps/search";
import { Map, useMap, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

const MarkerMap = ({
  coordinates,
  midpoint,
  iterations,
}: {
  coordinates: Coordinates[];
  midpoint: Coordinates;
  iterations: Coordinates[];
}) => {
  const map = useMap();

  React.useEffect(() => {
    if (!map) return;

    // Fit the map to the coordinates
    if (coordinates.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      [...coordinates, midpoint].forEach((coord) => {
        bounds.extend({ lat: coord.latitude, lng: coord.longitude });
      });
      map.fitBounds(bounds);
    }
  }, [map, coordinates, midpoint]);

  return (
    <Map
      mapId="marker-map" 
      colorScheme="FOLLOW_SYSTEM"
      defaultZoom={10}
      defaultCenter={{ lat: midpoint.latitude, lng: midpoint.longitude }}
      gestureHandling={"greedy"} 
      disableDefaultUI={true} 
      className="w-full h-screen"
    >
      {coordinates.map((coord, index) => (
        <AdvancedMarker
          key={`coord-${index}`}
          position={{ lat: coord.latitude, lng: coord.longitude }}
        >
          <Pin
            scale={1.25}
            // Can change background and borderColor also
            glyphColor={"#A71010"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5"
            >
              <path
                fillRule="evenodd"
                d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
                clipRule="evenodd"
              />
            </svg>
          </Pin>
        </AdvancedMarker>
      ))}

      <AdvancedMarker
        position={{ lat: midpoint.latitude, lng: midpoint.longitude }}
      />

      {iterations.map((iter, index) => (
        <AdvancedMarker
          key={`iter-${index}`}
          position={{ lat: iter.latitude, lng: iter.longitude }}
        >
          <div className="flex items-center justify-center bg-green-500 text-black font-bold rounded-full w-6 h-6 border border-white text-xs">
            {index + 1}
          </div>
        </AdvancedMarker>
      ))}
    </Map>
  );
};

export default MarkerMap;
