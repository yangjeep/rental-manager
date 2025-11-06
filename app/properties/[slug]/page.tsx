import { fetchListings } from "@/lib/fetchListings";
import ContactForm from "@/components/ContactForm";
import ListingGallery from "@/components/ListingGallery";
import type { Listing } from "@/lib/types";

export async function generateStaticParams() {
  const list = await fetchListings();
  return list.map((l: Listing) => ({ slug: l.slug }));
}

export default async function PropertyPage({ params }: { params: { slug: string } }) {
  const list: Listing[] = await fetchListings();
  const item = list.find(l => l.slug === params.slug);
  if (!item) return <div className="opacity-70">Not found.</div>;

  const gallery = item.images && item.images.length ? item.images : [item.imageUrl || "/placeholder.jpg"];

  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-semibold">{item.title}</h1>

      <ListingGallery images={gallery as string[]} alt={item.title} />

      <div className="text-lg">{fmtPrice(item.price)} / month · {item.bedrooms} BR · {item.city}</div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Info label="Status" value={item.status} />
        <Info label="Parking" value={fmtParking(item.parking)} />
        <Info label="Pets" value={item.pets || "—"} />
        <Info label="Utilities Included" value={item.utilitiesIncluded?.join(", ") || "—"} />
        <Info label="Address" value={item.address || "—"} />
      </div>

      <div className="opacity-90 whitespace-pre-line">{item.description}</div>

      <ContactForm listingTitle={item.title} />
    </article>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="card p-4">
      <div className="label mb-1">{label}</div>
      <div>{value || "—"}</div>
    </div>
  );
}

function fmtPrice(n: number) {
  return `$${(n || 0).toLocaleString()}`;
}

function fmtParking(v: any): string {
  if (typeof v === "boolean") return v ? "Available" : "Not available";
  if (typeof v === "string" && v.trim()) return v.trim();
  return "—";
}
