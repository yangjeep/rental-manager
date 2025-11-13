import type { Listing } from "./types";

type HomePageOptions = {
  filteredListings: Listing[];
  allListings: Listing[];
  filters: Record<string, string>;
};

const SITE_TITLE = "Rental Manager";
const DESCRIPTION = "Curated portfolio of long-term rentals powered entirely by Cloudflare Pages";

export function renderHomePage({ filteredListings, allListings, filters }: HomePageOptions): string {
  const cards = filteredListings.map(renderListingCard).join("") || `<p class="muted">No properties matched your filters.</p>`;
  const filterControls = renderFilters(allListings, filters);
  const hero = `
    <section class="hero">
      <div>
        <p class="eyebrow">All-in on Cloudflare</p>
        <h1>${escapeHtml(SITE_TITLE)}</h1>
        <p>${escapeHtml(DESCRIPTION)}</p>
      </div>
      <div class="hero-meta">
        <div><span>Total units</span><strong>${allListings.length}</strong></div>
        <div><span>Available today</span><strong>${filteredListings.filter(l => l.status !== "Rented").length}</strong></div>
      </div>
    </section>
  `;
  return layout(`${SITE_TITLE} · Rentals`, `
    ${hero}
    <section class="filters">${filterControls}</section>
    <section class="grid">${cards}</section>
  `);
}

export function renderPropertyPage(listing: Listing): string {
  const gallery = renderGallery(listing);
  const meta = `
    <ul class="meta">
      <li><span>Monthly rent</span><strong>${formatPrice(listing.price)}</strong></li>
      <li><span>Bedrooms</span><strong>${escapeHtml(String(listing.bedrooms || "—"))}</strong></li>
      <li><span>Bathrooms</span><strong>${escapeHtml(listing.bathrooms ? String(listing.bathrooms) : "—")}</strong></li>
      <li><span>Status</span><strong class="status ${listing.status.toLowerCase()}">${escapeHtml(listing.status)}</strong></li>
    </ul>
  `;
  const description = listing.description
    ? `<div class="prose">${escapeHtml(listing.description).replace(/\n/g, "<br>")}</div>`
    : `<p class="muted">No description yet.</p>`;
  return layout(`${listing.title} · ${SITE_TITLE}`, `
    <a class="back" href="/">← Back to all listings</a>
    <article class="property">
      <header>
        <div>
          <p class="eyebrow">${escapeHtml(listing.city)}</p>
          <h1>${escapeHtml(listing.title)}</h1>
          <p class="address">${escapeHtml(listing.address || "")}</p>
        </div>
        <div class="cta">
          <span class="price">${formatPrice(listing.price)} / mo</span>
          <a class="button" href="mailto:rentals@example.com?subject=${encodeURIComponent(`Inquiry: ${listing.title}`)}">Contact</a>
        </div>
      </header>
      ${gallery}
      ${meta}
      ${description}
    </article>
  `);
}

export function renderNotFound(message: string): string {
  return layout("Not found · " + SITE_TITLE, `
    <section class="not-found">
      <h1>Not found</h1>
      <p>${escapeHtml(message)}</p>
      <a class="button" href="/">Go home</a>
    </section>
  `);
}

export function renderSitemap(listings: Listing[], origin: string): string {
  const urls = listings
    .map(listing => `
      <url>
        <loc>${origin}/properties/${encodeURIComponent(listing.slug)}</loc>
        <changefreq>daily</changefreq>
      </url>
    `)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${origin}/</loc>
        <changefreq>hourly</changefreq>
      </url>
      ${urls}
    </urlset>`;
}

function renderFilters(listings: Listing[], filters: Record<string, string>): string {
  const uniqueCities = Array.from(new Set(listings.map(listing => listing.city).filter(Boolean))).sort();
  const cityOptions = [`<option value="All">All cities</option>`]
    .concat(uniqueCities.map(city => `<option value="${escapeAttribute(city)}" ${filters.city === city ? "selected" : ""}>${escapeHtml(city)}</option>`))
    .join("");
  const bedroomOptions = [0, 1, 2, 3, 4].map(num => {
    const label = num === 0 ? "Any" : `${num}+`;
    return `<option value="${num}" ${filters.bedrooms === String(num) ? "selected" : ""}>${label}</option>`;
  }).join("");
  const statusOptions = ["Available", "Pending", "Rented"].map(status => `
    <option value="${status}" ${filters.status === status ? "selected" : ""}>${status}</option>
  `).join("");
  return `
    <form>
      <label>
        <span>City</span>
        <select name="city">${cityOptions}</select>
      </label>
      <label>
        <span>Bedrooms</span>
        <select name="bedrooms">${bedroomOptions}</select>
      </label>
      <label>
        <span>Status</span>
        <select name="status">${statusOptions}</select>
      </label>
      <label>
        <span>Min rent</span>
        <input type="number" min="0" name="min" value="${escapeAttribute(filters.min || "")}" />
      </label>
      <label>
        <span>Max rent</span>
        <input type="number" min="0" name="max" value="${escapeAttribute(filters.max || "")}" />
      </label>
      <button class="button" type="submit">Apply</button>
      <a class="button ghost" href="/">Reset</a>
    </form>
  `;
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

function renderGallery(listing: Listing): string {
  const image = listing.imageUrl || "/placeholder.jpg";
  return `<div class="gallery">
    <img src="${escapeAttribute(image)}" alt="${escapeAttribute(listing.title)} photo" loading="lazy" />
  </div>`;
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <meta name="description" content="${escapeHtml(DESCRIPTION)}" />
      <link rel="stylesheet" href="/styles.css" />
    </head>
    <body>
      <main class="container">
        ${body}
      </main>
      <footer>
        <small>Built with Cloudflare Pages + Workers</small>
      </footer>
    </body>
  </html>`;
}

function formatPrice(value?: number): string {
  if (!value && value !== 0) return "$—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function escapeHtml(value?: string): string {
  if (value == null) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value?: string): string {
  return escapeHtml(value || "");
}
