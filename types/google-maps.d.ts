// Google Maps type definitions
declare global {
  interface Window {
    google: typeof google;
    initMap?: () => void;
  }
}

export {};

