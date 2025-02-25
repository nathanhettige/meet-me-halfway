import React from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { Marker } from "@react-google-maps/api";
import { Coordinates } from "@/server/handlers/maps/search";

const MarkerMap = ({
  coordinates,
  midpoint,
  iterations,
}: {
  coordinates: Coordinates[];
  midpoint: Coordinates;
  iterations: Coordinates[];
}) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [map, setMap] = React.useState<google.maps.Map>();

  const onLoad = React.useCallback(
    function callback(map: google.maps.Map) {
      // Fit the map to the coordinates
      if (coordinates.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        [...coordinates, midpoint].forEach((coord) => {
          bounds.extend({ lat: coord.latitude, lng: coord.longitude });
        });
        map.fitBounds(bounds);
      }
      setMap(map);
    },
    [coordinates, midpoint]
  );

  const onUnmount = React.useCallback(function callback() {
    setMap(undefined);
  }, []);

  return isLoaded ? (
    <GoogleMap
      mapContainerClassName="w-full h-screen"
      center={{
        lat: midpoint.latitude,
        lng: midpoint.longitude,
      }}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {[...coordinates, midpoint].map((coord, index) => (
        <Marker
          key={index}
          position={{ lat: coord.latitude, lng: coord.longitude }}
        />
      ))}
      {iterations.map((iter, index) => (
        <Marker
          key={index}
          position={{ lat: iter.latitude, lng: iter.longitude }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#00FF00",
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 8,
          }}
        />
      ))}
    </GoogleMap>
  ) : (
    <div>Loading...</div>
  );
};

export default MarkerMap;
