import { fetchListings } from "@/lib/fetchListings";
import PropertyTabs from "@/components/PropertyTabs";
import type { Listing } from "@/lib/types";

export async function generateStaticParams() {
  const list = await fetchListings();
  return list.map((l: Listing) => ({ slug: String(l.slug) }));
}

export default async function PropertyPage({ params }: { params: { slug: string } }) {
  const list: Listing[] = await fetchListings();
  // Ensure both slugs are strings for comparison
  const item = list.find(l => String(l.slug) === String(params.slug));
  if (!item) return <div className="opacity-70">Not found.</div>;

  return <PropertyTabs listing={item} />;
}
