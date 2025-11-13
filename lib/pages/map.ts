import type { Listing } from "../types";
import { renderLayout } from "./layout";
import { SITE_TITLE, escapeHtml, escapeAttribute, formatPrice, renderFilters, serializeForScript } from "./shared";

type MapPageOptions = {
  filteredListings: Listing[];
  allListings: Listing[];
  filters: Record<string, string>;
  googleMapsApiKey?: string;
  activePath?: string;
};

export function renderMapPage({ filteredListings, allListings, filters, googleMapsApiKey, activePath = "/map" }: MapPageOptions): string {
  const listingsData = filteredListings.map(listing => ({
    title: listing.title,
    slug: listing.slug,
    price: listing.price,
    address: listing.address || "",
    city: listing.city || "",
    status: listing.status,
    query: listing.address ? `${listing.address}, ${listing.city}` : listing.city || listing.title,
  }));
  const mapDataScript = `<script type="application/json" id="map-data">${serializeForScript(listingsData)}</script>`;
  const filterControls = renderFilters(allListings, filters, { resetHref: "/map" });
  const listItems = filteredListings.map(listing => {
    const label = listing.address ? `${listing.address}, ${listing.city}` : listing.city || "Location coming soon";
    const query = encodeURIComponent(listing.address || listing.city || listing.title);
    const statusClass = (listing.status || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `<li>
      <div class="listing-stack">
        <span class="listing-name">${escapeHtml(listing.title)}</span>
        <span class="listing-address">${escapeHtml(label)}</span>
        <span class="listing-price">${formatPrice(listing.price)}</span>
        <span class="listing-status ${statusClass}">${escapeHtml(listing.status)}</span>
      </div>
      <div class="listing-actions">
        <a class="button ghost" href="/properties/${encodeURIComponent(listing.slug)}">View</a>
        <a class="button ghost" href="https://maps.google.com/?q=${query}" target="_blank" rel="noopener noreferrer">Directions</a>
      </div>
    </li>`;
  }).join("");

  const body = `
    <section class="page-hero">
      <h1>Explore Properties on the Map</h1>
      <p>Use filters to refine the list and explore available homes with a birds-eye view.</p>
    </section>
    <section class="filters">${filterControls}</section>
    <section class="map-grid">
      <div id="map" role="region" aria-label="Rental property map"></div>
      <ul class="map-list">
        ${listItems || `<li class="muted">No listings available for the selected filters.</li>`}
      </ul>
    </section>
    ${mapDataScript}
  `;

  const apiKey = googleMapsApiKey || "YOUR_API_KEY";
  const extraScripts = `
    <script src="https://maps.googleapis.com/maps/api/js?key=${escapeAttribute(apiKey)}&callback=initMap" async defer></script>
    <script>
      function initMap() {
        var container = document.getElementById("map");
        var dataEl = document.getElementById("map-data");
        if (!container || !dataEl) return;
        
        var listings = [];
        try {
          listings = JSON.parse(dataEl.textContent || "[]");
        } catch (error) {
          console.error("Failed to parse map data", error);
        }
        
        var map = new google.maps.Map(container, {
          zoom: 4,
          center: { lat: 39.5, lng: -98.35 },
          mapTypeControl: true,
          streetViewControl: false,
        });
        
        var geocoder = new google.maps.Geocoder();
        var bounds = new google.maps.LatLngBounds();
        var markers = [];
        var currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
        
        function htmlEscape(value) {
          return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        }
        
        function createMarker(listing) {
          geocoder.geocode({ address: listing.query }, function(results, status) {
            if (status === "OK" && results[0]) {
              var location = results[0].geometry.location;
              var popupContent = [
                "<div style='padding: 0.75rem; min-width: 200px; background: white; color: black;'>",
                "<strong style='color: black;'>" + htmlEscape(listing.title) + "</strong><br>",
              ];
              if (listing.address) popupContent.push("<span style='color: black;'>" + htmlEscape(listing.address) + "</span><br>");
              if (listing.city) popupContent.push("<span style='color: black;'>" + htmlEscape(listing.city) + "</span><br>");
              if (listing.price) popupContent.push("<em style='color: black;'>" + currency.format(listing.price) + "</em><br>");
              popupContent.push("<a href='/properties/" + encodeURIComponent(listing.slug) + "' style='color: #0066cc; text-decoration: underline;'>View listing</a>");
              popupContent.push("</div>");
              
              var marker = new google.maps.Marker({
                position: location,
                map: map,
                title: listing.title,
              });
              
              var infoWindow = new google.maps.InfoWindow({
                content: popupContent.join(""),
              });
              
              marker.addListener("click", function() {
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
      }
    </script>
  `;

  return renderLayout({
    title: `Map · ${SITE_TITLE}`,
    body,
    extraScripts,
    activePath,
  });
}

