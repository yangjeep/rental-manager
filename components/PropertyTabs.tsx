"use client";
import ContactForm from "@/components/ContactForm";
import ListingGallery from "@/components/ListingGallery";
import TabbedLayout, { type Tab } from "@/components/TabbedLayout";
import GoogleMap from "@/components/GoogleMap";
import AboutSection from "@/components/AboutSection";
import type { Listing } from "@/lib/types";

type PropertyTabsProps = {
  listing: Listing;
};

export default function PropertyTabs({ listing }: PropertyTabsProps) {
  const gallery = listing.images && listing.images.length ? listing.images : [listing.imageUrl || "/placeholder.jpg"];

  const tabs: Tab[] = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <article className="space-y-6">
          <h1 className="text-3xl font-semibold">{listing.title}</h1>
          <ListingGallery images={gallery as string[]} alt={listing.title} />
          <div className="text-lg">
            {fmtPrice(listing.price)} / month · {listing.bedrooms} BR · {listing.city}
          </div>
          <div className="opacity-90 whitespace-pre-line">{listing.description}</div>
        </article>
      ),
    },
    {
      id: "map",
      label: "Map",
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">{listing.title}</h2>
          <GoogleMap listing={listing} height="600px" />
        </div>
      ),
    },
    {
      id: "details",
      label: "Details",
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">{listing.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Status" value={listing.status} />
            <Info label="Parking" value={fmtParking(listing.parking)} />
            <Info label="Pets" value={listing.pets || "—"} />
            <Info label="Address" value={listing.address || "—"} />
            <Info label="Price" value={fmtPrice(listing.price)} />
            <Info label="Bedrooms" value={String(listing.bedrooms)} />
            <Info label="City" value={listing.city} />
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      label: "Contact",
      content: (
        <div className="space-y-6">
          <ContactForm listingTitle={listing.title} />
        </div>
      ),
    },
    {
      id: "about",
      label: "About",
      content: <AboutSection />,
    },
  ];

  return <TabbedLayout tabs={tabs} defaultTab="overview" />;
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

function fmtParking(v: string | undefined): string {
  if (v && v.trim()) return v.trim();
  return "—";
}

