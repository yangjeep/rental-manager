import { fetchListings } from '@/lib/fetchListings';
import { ListingCard } from '@/components/ListingCard';
import { FilterControls } from '@/components/FilterControls';
import { SITE_TITLE, DESCRIPTION } from '@/lib/pages/shared';
import type { Listing } from '@/lib/types';

export const runtime = 'edge';

interface HomePageProps {
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

export default async function HomePage({ searchParams }: HomePageProps) {
  const allListings = await fetchListings();
  const params = new URLSearchParams();
  
  // Convert searchParams to URLSearchParams
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && typeof value === 'string') {
      params.set(key, value);
    }
  });
  
  const filteredListings = applyFilters(allListings, params);
  const availableCount = filteredListings.filter(l => l.status !== "Rented").length;

  return (
    <>
      <section className="flex flex-wrap gap-8 items-start mb-8">
        <div>
          <p className="uppercase tracking-widest text-xs text-accent">Thoughtfully Managed Homes</p>
          <h1 className="text-[clamp(2.5rem,6vw,3.5rem)] my-2 mb-2">{SITE_TITLE}</h1>
          <p className="m-0 text-muted">{DESCRIPTION}</p>
        </div>
        <div className="flex gap-6 p-4 px-6 bg-white/3 border border-white/8 rounded-2xl">
          <div>
            <span className="block text-xs text-muted">Total units</span>
            <strong className="text-3xl">{allListings.length}</strong>
          </div>
          <div>
            <span className="block text-xs text-muted">Available today</span>
            <strong className="text-3xl">{availableCount}</strong>
          </div>
        </div>
      </section>
      
      <FilterControls listings={allListings} resetHref="/" />
      
      <section className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mt-8">
        {filteredListings.length > 0 ? (
          filteredListings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : (
          <p className="text-muted">No properties matched your filters.</p>
        )}
      </section>
    </>
  );
}

