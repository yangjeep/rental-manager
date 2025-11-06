"use client";
import Filters from "@/components/Filters";
import ListingCard from "@/components/ListingCard";
import TabbedLayout, { type Tab } from "@/components/TabbedLayout";
import GoogleMap from "@/components/GoogleMap";
import AboutSection from "@/components/AboutSection";
import ContactForm from "@/components/ContactForm";
import type { Listing } from "@/lib/types";

type HomeTabsProps = {
  filteredListings: Listing[];
};

export default function HomeTabs({ filteredListings }: HomeTabsProps) {
  const tabs: Tab[] = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div className="space-y-6">
          <Filters />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((l: Listing) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
          {filteredListings.length === 0 && (
            <div className="opacity-70">No listings match your filters.</div>
          )}
        </div>
      ),
    },
    {
      id: "map",
      label: "Map",
      content: (
        <div className="space-y-6">
          <Filters />
          <GoogleMap listings={filteredListings} height="600px" />
        </div>
      ),
    },
    {
      id: "details",
      label: "Details",
      content: (
        <div className="space-y-6">
          <Filters />
          <div className="card p-6">
            <h2 className="text-2xl font-semibold mb-4">Property Statistics</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-3xl font-bold mb-1">{filteredListings.length}</div>
                <div className="text-sm opacity-70">Total Properties</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">
                  {filteredListings.filter((l) => l.status === "Available").length}
                </div>
                <div className="text-sm opacity-70">Available</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">
                  ${filteredListings.length > 0
                    ? Math.round(
                        filteredListings.reduce((sum, l) => sum + l.price, 0) /
                          filteredListings.length
                      ).toLocaleString()
                    : "0"}
                </div>
                <div className="text-sm opacity-70">Avg. Price</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">
                  {filteredListings.length > 0
                    ? (
                        filteredListings.reduce((sum, l) => sum + l.bedrooms, 0) /
                        filteredListings.length
                      ).toFixed(1)
                    : "0"}
                </div>
                <div className="text-sm opacity-70">Avg. Bedrooms</div>
              </div>
            </div>
          </div>
          {filteredListings.length > 0 && (
            <div className="card p-6">
              <h2 className="text-2xl font-semibold mb-4">Property Details</h2>
              <div className="space-y-4">
                {filteredListings.map((listing) => (
                  <div key={listing.id} className="border-b border-white/10 pb-4 last:border-0">
                    <h3 className="font-semibold mb-2">{listing.title}</h3>
                    <div className="grid gap-2 sm:grid-cols-2 text-sm opacity-80">
                      <div>Price: ${listing.price.toLocaleString()} / month</div>
                      <div>Bedrooms: {listing.bedrooms}</div>
                      <div>City: {listing.city}</div>
                      <div>Status: {listing.status}</div>
                      {listing.address && <div>Address: {listing.address}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "contact",
      label: "Contact",
      content: (
        <div className="space-y-6">
          <ContactForm listingTitle="General Inquiry" />
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

