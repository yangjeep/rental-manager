import type { Listing } from "../types";
import { renderLayout } from "./layout";
import { SITE_TITLE, escapeAttribute, escapeHtml, formatPrice } from "./shared";

type PropertyPageOptions = {
  listing: Listing;
};

export function renderPropertyPage({ listing }: PropertyPageOptions): string {
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

  const body = `
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
  `;

  return renderLayout({
    title: `${listing.title} · ${SITE_TITLE}`,
    body,
  });
}

function renderGallery(listing: Listing): string {
  const images = listing.images && listing.images.length > 0 
    ? listing.images 
    : [listing.imageUrl || "/placeholder.jpg"];
  
  if (images.length === 1) {
    return `<div class="gallery gallery-single">
      <img src="${escapeAttribute(images[0])}" alt="${escapeAttribute(listing.title)} photo" loading="lazy" />
    </div>`;
  }
  
  const mainImage = images[0];
  const thumbnails = images.slice(1);
  
  return `<div class="gallery gallery-multi">
    <div class="gallery-main">
      <img id="gallery-main-img" src="${escapeAttribute(mainImage)}" alt="${escapeAttribute(listing.title)} photo" loading="lazy" />
    </div>
    <div class="gallery-thumbs">
      ${images.map((img, idx) => `
        <button class="gallery-thumb ${idx === 0 ? 'active' : ''}" 
                data-src="${escapeAttribute(img)}" 
                aria-label="View image ${idx + 1} of ${images.length}">
          <img src="${escapeAttribute(img)}" alt="${escapeAttribute(listing.title)} photo ${idx + 1}" loading="lazy" />
        </button>
      `).join("")}
    </div>
    <script>
      (function() {
        var thumbs = document.querySelectorAll('.gallery-thumb');
        var mainImg = document.getElementById('gallery-main-img');
        if (!mainImg) return;
        thumbs.forEach(function(thumb) {
          thumb.addEventListener('click', function() {
            var src = this.getAttribute('data-src');
            if (src) {
              mainImg.src = src;
              thumbs.forEach(function(t) { t.classList.remove('active'); });
              this.classList.add('active');
            }
          });
        });
      })();
    </script>
  </div>`;
}

