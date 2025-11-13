// Google Maps type definitions
declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (element: HTMLElement, options?: any) => any;
        Geocoder: new () => any;
        LatLngBounds: new () => any;
        Marker: new (options?: any) => any;
        InfoWindow: new (options?: any) => any;
      };
    };
    initMap?: () => void;
  }
}

export {};

