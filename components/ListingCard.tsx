import Link from "next/link";
import type { Listing } from "@/lib/types";

export default function ListingCard({ listing }: { listing: Listing }) {
  const imageSrc = (listing.images && listing.images[0]) || listing.imageUrl || "/placeholder.jpg";
  
  return (
    <Link href={`/properties/${listing.slug}`} className="card overflow-hidden hover:border-white/30">
      <img 
        src={imageSrc}
        alt={listing.title} 
        className="h-48 w-full object-cover"
        onError={(e) => {
          // Fallback to placeholder if image fails to load
          if ((e.target as HTMLImageElement).src !== "/placeholder.jpg") {
            (e.target as HTMLImageElement).src = "/placeholder.jpg";
          }
        }}
      />
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{listing.title}</h3>
          <span className="text-xs rounded-full border px-2 py-0.5 opacity-80">{listing.status}</span>
        </div>
        <div className="opacity-80">${listing.price} / mo · {listing.bedrooms} BR · {listing.city}</div>
        <div className="flex gap-2 text-xs opacity-80">
          <Badge label={fmtParkingShort(listing.parking)} />
          <Badge label={fmtPetsShort(listing.pets)} />
        </div>
      </div>
    </Link>
  );
}

function Badge({ label }: { label?: string }) {
  if (!label) return null;
  return <span className="rounded-full border border-white/20 px-2 py-0.5">{label}</span>;
}

function fmtParkingShort(v: string | undefined): string | undefined {
  if (v && v.trim()) return v.trim();
  return undefined;
}

function fmtPetsShort(v: any): string | undefined {
  if (!v) return undefined;
  const s = String(v).toLowerCase();
  if (s.startsWith("allow")) return "Pets OK";
  if (s.startsWith("not")) return "No Pets";
  if (s.startsWith("cond")) return "Pets Cond.";
  return String(v);
}
