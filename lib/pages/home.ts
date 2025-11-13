import type { Listing } from "../types";
import { renderLayout } from "./layout";
import { DESCRIPTION, SITE_TITLE, escapeAttribute, escapeHtml, formatPrice, renderFilters } from "./shared";

type HomePageOptions = {
  filteredListings: Listing[];
  allListings: Listing[];
  filters: Record<string, string>;
  activePath?: string;
};

export function renderHomePage({ filteredListings, allListings, filters, activePath = "/" }: HomePageOptions): string {
  const cards = filteredListings.map(renderListingCard).join("") || `<p class="muted">No properties matched your filters.</p>`;
  const filterControls = renderFilters(allListings, filters, { resetHref: "/" });
  const availableCount = filteredListings.filter(l => l.status !== "Rented").length;
  const hero = `
    <section class="hero">
      <div>
        <p class="eyebrow">Thoughtfully Managed Homes</p>
        <h1>${escapeHtml(SITE_TITLE)}</h1>
        <p>${escapeHtml(DESCRIPTION)}</p>
      </div>
      <div class="hero-meta">
        <div><span>Total units</span><strong>${allListings.length}</strong></div>
        <div><span>Available today</span><strong>${availableCount}</strong></div>
      </div>
    </section>
  `;

  const body = `
    ${hero}
    <section class="filters">${filterControls}</section>
    <section class="grid">${cards}</section>
  `;

  return renderLayout({
    title: `${SITE_TITLE} · Rentals`,
    body,
    activePath,
  });
}

function renderListingCard(listing: Listing): string {
  const cover = listing.imageUrl || "/placeholder.jpg";
  return `
    <article class="card">
      <a href="/properties/${encodeURIComponent(listing.slug)}">
        <img src="${escapeAttribute(cover)}" alt="${escapeAttribute(listing.title)} cover" loading="lazy" />
        <div class="card-body">
          <div class="status-pill ${listing.status.toLowerCase()}">${escapeHtml(listing.status)}</div>
          <h2>${escapeHtml(listing.title)}</h2>
          <p class="address">${escapeHtml(listing.address || listing.city)}</p>
          <p class="price">${formatPrice(listing.price)}</p>
          <ul class="facts">
            <li>${escapeHtml(String(listing.bedrooms))} bd</li>
            <li>${escapeHtml(listing.bathrooms ? String(listing.bathrooms) : "—")} ba</li>
            <li>${escapeHtml(listing.parking || "Parking TBD")}</li>
          </ul>
        </div>
      </a>
    </article>
  `;
}

