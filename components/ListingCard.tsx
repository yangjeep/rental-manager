import { Link } from "@remix-run/react";
import type { Listing } from "~/lib/types";
import { formatPrice } from "~/lib/pages/shared";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const cover = listing.imageUrl || "/placeholder.jpg";
  const statusClass = listing.status.toLowerCase();

  return (
    <article className="bg-card/90 border border-white/8 rounded-2xl overflow-hidden transition-transform hover:-translate-y-1 hover:border-accent/60">
      <Link to={`/properties/${encodeURIComponent(listing.slug)}`} className="flex flex-col gap-4 p-4 pb-6 text-inherit no-underline">
        <img
          src={cover}
          alt={`${listing.title} cover`}
          width={400}
          height={300}
          className="w-full h-auto rounded-2xl object-cover"
          loading="lazy"
        />
        <div>
          <div className={`inline-block px-3 py-0.5 rounded-full text-xs uppercase tracking-wider ${
            statusClass === 'available' ? 'text-green-400' :
            statusClass === 'pending' ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {listing.status}
          </div>
          <h2 className="mt-2 mb-1 text-xl font-semibold">{listing.title}</h2>
          <p className="my-1 text-muted">{listing.address || listing.city}</p>
          <p className="text-2xl my-2 font-semibold">{formatPrice(listing.price)}</p>
          <ul className="flex gap-4 list-none p-0 m-0 text-muted text-sm">
            <li>{listing.bedrooms} bd</li>
            <li>{listing.bathrooms ? `${listing.bathrooms} ba` : "—"}</li>
            <li>{listing.parking || "Parking TBD"}</li>
          </ul>
        </div>
      </Link>
    </article>
  );
}
