import HomeTabs from "@/components/HomeTabs";
import { fetchListings } from "@/lib/fetchListings";
import type { Listing } from "@/lib/types";

export default async function Home({ searchParams }: { searchParams: any }) {
  const all = await fetchListings();
  const filtered = applyFilters(all, searchParams);
  return <HomeTabs filteredListings={filtered} />;
}

function applyFilters(list: Listing[], q: Record<string, string>) {
  return list.filter(l => {
    const okCity = q?.city ? l.city?.toLowerCase() === String(q.city).toLowerCase() : true;
    const okBed  = q?.bedrooms ? Number(l.bedrooms) >= Number(q.bedrooms) : true;
    const min = q?.min ? Number(l.price) >= Number(q.min) : true;
    const max = q?.max ? Number(l.price) <= Number(q.max) : true;
    const status = q?.status ? l.status === q.status : l.status !== "Rented";
    return okCity && okBed && min && max && status;
  });
}
