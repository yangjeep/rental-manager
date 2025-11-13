import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchListings } from '@/lib/fetchListings';
import { PropertyGallery } from '@/components/PropertyGallery';
import { formatPrice, SITE_TITLE } from '@/lib/pages/shared';

interface PropertyPageProps {
  params: {
    slug: string;
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const listings = await fetchListings();
  const slug = decodeURIComponent(params.slug);
  const listing = listings.find(item => item.slug === slug || item.id === slug);

  if (!listing) {
    notFound();
  }

  const statusClass = listing.status.toLowerCase();

  return (
    <>
      <Link href="/" className="inline-block mb-4 text-accent no-underline">
        ← Back to all listings
      </Link>
      <article className="property">
        <header className="flex flex-wrap justify-between gap-4 items-start">
          <div>
            <p className="uppercase tracking-widest text-xs text-accent">{listing.city}</p>
            <h1 className="text-[clamp(2rem,5vw,2.8rem)] my-2 mb-2">{listing.title}</h1>
            <p className="text-muted">{listing.address || ""}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <span className="text-2xl font-semibold">{formatPrice(listing.price)} / mo</span>
            <a
              href={`mailto:rentals@example.com?subject=${encodeURIComponent(`Inquiry: ${listing.title}`)}`}
              className="rounded-full px-5 py-2.5 bg-accent text-[#04140f] font-semibold border-none cursor-pointer text-center no-underline"
            >
              Contact
            </a>
          </div>
        </header>
        
        <PropertyGallery listing={listing} />
        
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 p-6 rounded-xl bg-card/85 border border-white/8 list-none">
          <li>
            <span className="text-muted text-sm">Monthly rent</span>
            <strong className="block text-xl">{formatPrice(listing.price)}</strong>
          </li>
          <li>
            <span className="text-muted text-sm">Bedrooms</span>
            <strong className="block text-xl">{listing.bedrooms || "—"}</strong>
          </li>
          <li>
            <span className="text-muted text-sm">Bathrooms</span>
            <strong className="block text-xl">{listing.bathrooms ? String(listing.bathrooms) : "—"}</strong>
          </li>
          <li>
            <span className="text-muted text-sm">Status</span>
            <strong className={`block text-xl ${
              statusClass === 'available' ? 'text-green-400' :
              statusClass === 'pending' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {listing.status}
            </strong>
          </li>
        </ul>
        
        {listing.description ? (
          <div className="leading-relaxed text-fg mt-6 whitespace-pre-line">
            {listing.description.split('\n').map((line, i) => (
              <p key={i} className="mb-4">{line}</p>
            ))}
          </div>
        ) : (
          <p className="text-muted mt-6">No description yet.</p>
        )}
      </article>
    </>
  );
}

export async function generateMetadata({ params }: PropertyPageProps) {
  const listings = await fetchListings();
  const slug = decodeURIComponent(params.slug);
  const listing = listings.find(item => item.slug === slug || item.id === slug);

  if (!listing) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: `${listing.title} · ${SITE_TITLE}`,
  };
}

