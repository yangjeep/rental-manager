import { fetchListings } from '@/lib/fetchListings';
import { FilterControls } from '@/components/FilterControls';
import { MapView } from '@/components/MapView';
import { SITE_TITLE } from '@/lib/pages/shared';
import { readEnv } from '@/lib/env';
import type { Listing } from '@/lib/types';
import Link from 'next/link';
import { formatPrice } from '@/lib/pages/shared';

interface MapPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

function applyFilters(listings: Listing[], params: URLSearchParams): Listing[] {
  const city = params.get("city");
  const bedrooms = params.get("bedrooms");
  const min = params.get("min");
  const max = params.get("max");
  const status = params.get("status");

  return listings.filter(listing => {
    const cityOk = !city || city === "All" || listing.city?.toLowerCase() === city.toLowerCase();
    const bedroomOk = !bedrooms || Number(listing.bedrooms) >= Number(bedrooms);
    const minOk = !min || Number(listing.price) >= Number(min);
    const maxOk = !max || Number(listing.price) <= Number(max);
    const statusOk = !status ? listing.status !== "Rented" : listing.status === status;
    return cityOk && bedroomOk && minOk && maxOk && statusOk;
  });
}

export default async function MapPage({ searchParams }: MapPageProps) {
  const allListings = await fetchListings();
  const params = new URLSearchParams();
  
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && typeof value === 'string') {
      params.set(key, value);
    }
  });
  
  const filteredListings = applyFilters(allListings, params);
  const googleMapsApiKey = readEnv(undefined, "GOOGLE_MAPS_API_KEY");

  return (
    <>
      <section className="mb-10">
        <h1 className="text-[clamp(2rem,5vw,2.8rem)] mb-3">Explore Properties on the Map</h1>
        <p className="m-0 max-w-[620px] text-muted leading-relaxed">
          Use filters to refine the list and explore available homes with a birds-eye view.
        </p>
      </section>
      
      <FilterControls listings={allListings} resetHref="/map" />
      
      <section className="grid grid-cols-1 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-6 items-start mt-6">
        <MapView listings={filteredListings} googleMapsApiKey={googleMapsApiKey} />
        <ul className="list-none m-0 p-0 flex flex-col gap-4">
          {filteredListings.length > 0 ? (
            filteredListings.map(listing => {
              const label = listing.address ? `${listing.address}, ${listing.city}` : listing.city || "Location coming soon";
              const query = encodeURIComponent(listing.address || listing.city || listing.title);
              const statusClass = (listing.status || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
              
              return (
                <li
                  key={listing.id}
                  className="bg-card/90 border border-white/8 rounded-xl p-5 flex flex-col gap-2"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{listing.title}</span>
                    <span className="text-muted text-sm">{label}</span>
                    <span className="text-fg font-semibold">{formatPrice(listing.price)}</span>
                    <span className={`text-xs uppercase tracking-wider ${
                      statusClass === 'available' ? 'text-green-400' :
                      statusClass === 'pending' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {listing.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/properties/${encodeURIComponent(listing.slug)}`}
                      className="rounded-full px-4 py-2 bg-transparent border border-white/25 text-fg font-semibold text-center no-underline text-sm hover:bg-white/10"
                    >
                      View
                    </Link>
                    <a
                      href={`https://maps.google.com/?q=${query}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full px-4 py-2 bg-transparent border border-white/25 text-fg font-semibold text-center no-underline text-sm hover:bg-white/10"
                    >
                      Directions
                    </a>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="text-muted">No listings available for the selected filters.</li>
          )}
        </ul>
      </section>
    </>
  );
}

export const metadata = {
  title: `Map · ${SITE_TITLE}`,
};

