"use client";
import React, { useMemo, useCallback, useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import type { Listing } from "@/lib/types";

type GoogleMapProps = {
  listings?: Listing[];
  listing?: Listing;
  height?: string;
};

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function GoogleMapComponent({ listings, listing, height = "500px" }: GoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Determine which listings to show
  const propertiesToShow = useMemo(() => {
    if (listing) return [listing];
    if (listings) return listings;
    return [];
  }, [listing, listings]);

  // Geocode addresses to coordinates
  const [markers, setMarkers] = useState<Array<{
    listing: Listing;
    position: { lat: number; lng: number };
    address: string;
  }>>([]);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (isLoaded && !geocoder) {
      setGeocoder(new google.maps.Geocoder());
    }
  }, [isLoaded, geocoder]);

  useEffect(() => {
    if (!isLoaded || !geocoder || propertiesToShow.length === 0) return;

    const geocodeAll = async () => {
      const results = await Promise.allSettled(
        propertiesToShow.map(async (prop) => {
          if (!prop.address) {
            // Try to geocode using city as fallback
            const address = prop.city || "";
            const result = await geocoder.geocode({ address });
            if (result.results[0]) {
              const loc = result.results[0].geometry.location;
              return {
                listing: prop,
                position: { lat: loc.lat(), lng: loc.lng() },
                address: prop.address || prop.city || "",
              };
            }
            return null;
          } else {
            const result = await geocoder.geocode({ address: prop.address });
            if (result.results[0]) {
              const loc = result.results[0].geometry.location;
              return {
                listing: prop,
                position: { lat: loc.lat(), lng: loc.lng() },
                address: prop.address,
              };
            }
            return null;
          }
        })
      );

      const validMarkers = results
        .filter((r) => r.status === "fulfilled" && r.value !== null)
        .map((r) => (r.status === "fulfilled" ? r.value : null))
        .filter((m): m is NonNullable<typeof m> => m !== null);

      setMarkers(validMarkers);
    };

    geocodeAll();
  }, [isLoaded, geocoder, propertiesToShow]);

  // Calculate center of map
  const center = useMemo(() => {
    if (markers.length === 0) {
      // Default to Ottawa, ON
      return { lat: 45.4215, lng: -75.6972 };
    }
    if (markers.length === 1) {
      return markers[0].position;
    }
    // Calculate center of all markers
    const avgLat = markers.reduce((sum, m) => sum + m.position.lat, 0) / markers.length;
    const avgLng = markers.reduce((sum, m) => sum + m.position.lng, 0) / markers.length;
    return { lat: avgLat, lng: avgLng };
  }, [markers]);

  const defaultZoom = useMemo(() => (markers.length === 1 ? 15 : 12), [markers.length]);

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: false,
      clickableIcons: true,
      scrollwheel: true,
    }),
    []
  );

  const onLoad = useCallback((map: google.maps.Map) => {
    if (markers.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((marker) => {
        bounds.extend(marker.position);
      });
      map.fitBounds(bounds);
    }
  }, [markers]);

  if (loadError) {
    return (
      <div className="card p-6 text-center">
        <p className="opacity-70">Error loading Google Maps. Please check your API key configuration.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="card p-6 text-center">
        <p className="opacity-70">Loading map...</p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="card p-6 text-center">
        <p className="opacity-70">
          Google Maps API key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
        </p>
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="opacity-70">No property locations available to display on the map.</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={defaultZoom}
        options={mapOptions}
        onLoad={onLoad}
      >
        {markers.map((marker, index) => (
          <Marker
            key={marker.listing.id}
            position={marker.position}
            onClick={() => setSelectedMarker(selectedMarker === index ? null : index)}
          >
            {selectedMarker === index && (
              <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                <div className="text-black p-2">
                  <h3 className="font-semibold text-sm mb-1">{marker.listing.title}</h3>
                  <p className="text-xs opacity-80 mb-1">
                    ${marker.listing.price.toLocaleString()} / month · {marker.listing.bedrooms} BR
                  </p>
                  {marker.address && (
                    <p className="text-xs opacity-70">{marker.address}</p>
                  )}
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>
    </div>
  );
}

