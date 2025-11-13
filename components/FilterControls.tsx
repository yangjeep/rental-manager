import { Form, useSearchParams } from "@remix-run/react";
import type { Listing } from "~/lib/types";

interface FilterControlsProps {
  listings: Listing[];
  resetHref?: string;
}

export function FilterControls({ listings, resetHref = "/" }: FilterControlsProps) {
  const [searchParams] = useSearchParams();
  
  const uniqueCities = Array.from(new Set(listings.map(listing => listing.city).filter(Boolean))).sort();
  const currentCity = searchParams.get('city') || '';
  const currentBedrooms = searchParams.get('bedrooms') || '0';
  const currentStatus = searchParams.get('status') || '';
  const currentMin = searchParams.get('min') || '';
  const currentMax = searchParams.get('max') || '';

  return (
    <section className="filters">
      <Form method="get" className="realtime-filters grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 p-6 rounded-2xl bg-card/85 border border-white/6 backdrop-blur-xl">
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          <span>City</span>
          <select
            name="city"
            defaultValue={currentCity}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="bg-bg border border-white/12 text-fg rounded-xl px-3 py-2"
          >
            <option value="All">All cities</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </label>
        
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          <span>Bedrooms</span>
          <select
            name="bedrooms"
            defaultValue={currentBedrooms}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="bg-bg border border-white/12 text-fg rounded-xl px-3 py-2"
          >
            {[0, 1, 2, 3, 4].map(num => (
              <option key={num} value={num}>{num === 0 ? 'Any' : `${num}+`}</option>
            ))}
          </select>
        </label>
        
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          <span>Status</span>
          <select
            name="status"
            defaultValue={currentStatus}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="bg-bg border border-white/12 text-fg rounded-xl px-3 py-2"
          >
            <option value="">All</option>
            {['Available', 'Pending', 'Rented'].map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          <span>Min rent</span>
          <input
            type="number"
            min="0"
            name="min"
            defaultValue={currentMin}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="bg-bg border border-white/12 text-fg rounded-xl px-3 py-2"
          />
        </label>
        
        <label className="flex flex-col gap-1.5 text-sm text-muted">
          <span>Max rent</span>
          <input
            type="number"
            min="0"
            name="max"
            defaultValue={currentMax}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="bg-bg border border-white/12 text-fg rounded-xl px-3 py-2"
          />
        </label>
        
        <a
          href={resetHref}
          className="self-end rounded-full px-5 py-2.5 bg-transparent border border-white/25 text-fg font-semibold text-center no-underline hover:bg-white/10"
        >
          Reset
        </a>
      </Form>
    </section>
  );
}
