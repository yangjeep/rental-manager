import { fetchListings } from "@/lib/fetchListings";
import PropertyTabs from "@/components/PropertyTabs";
import type { Listing } from "@/lib/types";

// Revalidate every 60 seconds (or use REVALIDATE_SECONDS env var)
export const revalidate = Number(process.env.REVALIDATE_SECONDS) || 60;

export async function generateStaticParams() {
  try {
    const list = await fetchListings();
    // Return empty array if no listings (allows build to succeed)
    if (!list || list.length === 0) {
      return [];
    }
    return list.map((l: Listing) => ({ slug: String(l.slug) }));
  } catch (error) {
    console.error('Error generating static params:', error);
    // Return empty array to allow build to succeed
    return [];
  }
}

export default async function PropertyPage({ params }: { params: { slug: string } }) {
  const list: Listing[] = await fetchListings();
  // Ensure both slugs are strings for comparison
  const item = list.find(l => String(l.slug) === String(params.slug));
  if (!item) return <div className="opacity-70">Not found.</div>;

  return <PropertyTabs listing={item} />;
}
