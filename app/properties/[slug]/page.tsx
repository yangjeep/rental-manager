import { fetchListings } from "@/lib/fetchListings";
import PropertyTabs from "@/components/PropertyTabs";
import type { Listing } from "@/lib/types";

export async function generateStaticParams() {
  const list = await fetchListings();
  return list.map((l: Listing) => ({ slug: l.slug }));
}

export default async function PropertyPage({ params }: { params: { slug: string } }) {
  const list: Listing[] = await fetchListings();
  const item = list.find(l => l.slug === params.slug);
  if (!item) return <div className="opacity-70">Not found.</div>;

  return <PropertyTabs listing={item} />;
}
