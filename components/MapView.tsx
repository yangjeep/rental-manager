'use client';

import { useEffect, useRef } from 'react';
import type { Listing } from '@/lib/types';

interface MapViewProps {
  listings: Listing[];
  googleMapsApiKey?: string;
}

// Google Maps types
declare global {
  interface Window {
    google: typeof google;
    initMap?: () => void;
  }
}

export function MapView({ listings, googleMapsApiKey }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || !googleMapsApiKey || typeof window === 'undefined') return;

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=initMap`;
      script.async = true;
      script.defer = true;
      (window as any).initMap = () => {
        initializeMap();
      };
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    function initializeMap() {
      if (!mapRef.current || !window.google || !window.google.maps) return;

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 4,
        center: { lat: 39.5, lng: -98.35 },
        mapTypeControl: true,
        streetViewControl: false,
      });

      mapInstanceRef.current = map;
      const geocoder = new window.google.maps.Geocoder();
      const bounds = new window.google.maps.LatLngBounds();
      const markers: any[] = [];
      const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

      function htmlEscape(value: unknown): string {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function createMarker(listing: Listing) {
        const query = listing.address ? `${listing.address}, ${listing.city}` : listing.city || listing.title;
        
        geocoder.geocode({ address: query }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            const popupContent = [
              "<div style='padding: 0.75rem; min-width: 200px; background: white; color: black;'>",
              "<strong style='color: black;'>" + htmlEscape(listing.title) + "</strong><br>",
            ];
            if (listing.address) popupContent.push("<span style='color: black;'>" + htmlEscape(listing.address) + "</span><br>");
            if (listing.city) popupContent.push("<span style='color: black;'>" + htmlEscape(listing.city) + "</span><br>");
            if (listing.price) popupContent.push("<em style='color: black;'>" + currency.format(listing.price) + "</em><br>");
            popupContent.push("<a href='/properties/" + encodeURIComponent(listing.slug) + "' style='color: #0066cc; text-decoration: underline;'>View listing</a>");
            popupContent.push("</div>");

            const marker = new window.google.maps.Marker({
              position: location,
              map: map,
              title: listing.title,
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: popupContent.join(""),
            });

            marker.addListener("click", () => {
              infoWindow.open(map, marker);
            });

            markers.push(marker);
            bounds.extend(location);

            if (markers.length === listings.length) {
              map.fitBounds(bounds);
            }
          }
        });
      }

      listings.forEach(createMarker);
      markersRef.current = markers;
    }

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [listings, googleMapsApiKey]);

  return (
    <div
      id="map"
      ref={mapRef}
      className="w-full min-h-[420px] h-[600px] border-0 rounded-2xl bg-card/85 shadow-[0_25px_70px_rgba(0,0,0,0.45)]"
      role="region"
      aria-label="Rental property map"
    />
  );
}

