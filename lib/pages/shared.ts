import type { Listing } from "../types";

export const SITE_TITLE = "Rental Manager";
export const DESCRIPTION = "Curated portfolio of long-term rentals built for discerning renters";

type FilterOptions = {
  resetHref?: string;
  action?: string;
};

export function renderFilters(listings: Listing[], filters: Record<string, string>, options: FilterOptions = {}): string {
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
  const actionAttr = options.action ? ` action="${escapeAttribute(options.action)}"` : "";
  const resetHref = options.resetHref ?? "/";
  return `
    <form method="get" class="realtime-filters"${actionAttr}>
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
      <a class="button ghost" href="${escapeAttribute(resetHref)}">Reset</a>
    </form>
    <script>
      (function() {
        var form = document.querySelector('.realtime-filters');
        if (!form) return;
        var baseUrl = '${escapeAttribute(resetHref)}';
        function updateFilters() {
          var formData = new FormData(form);
          var params = new URLSearchParams();
          formData.forEach(function(value, key) {
            if (value && value !== 'All' && value !== '0') {
              params.set(key, value);
            }
          });
          var queryString = params.toString();
          var newUrl = baseUrl + (queryString ? '?' + queryString : '');
          window.location.href = newUrl;
        }
        form.querySelectorAll('select, input').forEach(function(el) {
          el.addEventListener('change', updateFilters);
        });
      })();
    </script>
  `;
}

export function formatPrice(value?: number): string {
  if (value == null) return "$—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function escapeHtml(value?: string): string {
  if (value == null) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttribute(value?: string): string {
  return escapeHtml(value || "");
}

export function serializeForScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

