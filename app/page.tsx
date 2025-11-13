import HomeTabs from "@/components/HomeTabs";
import { fetchListings } from "@/lib/fetchListings";
import type { Listing } from "@/lib/types";

// Revalidate every 60 seconds (or use REVALIDATE_SECONDS env var)
export const revalidate = Number(process.env.REVALIDATE_SECONDS) || 60;

export default async function Home({ searchParams }: { searchParams: any }) {
  const all = await fetchListings();
  const filtered = applyFilters(all, searchParams);
  return <HomeTabs filteredListings={filtered} allListings={all} />;
}

function applyFilters(list: Listing[], q: Record<string, string>) {
  return list.filter(l => {
    const cityFilter = q?.city && q.city !== "All" ? l.city?.toLowerCase() === String(q.city).toLowerCase() : true;
    const okBed  = q?.bedrooms ? Number(l.bedrooms) >= Number(q.bedrooms) : true;
    const min = q?.min ? Number(l.price) >= Number(q.min) : true;
    const max = q?.max ? Number(l.price) <= Number(q.max) : true;
    const status = q?.status ? l.status === q.status : l.status !== "Rented";
    const pet = q?.pet ? l.pets === q.pet : true;
    return cityFilter && okBed && min && max && status && pet;
  });
}
