"use client";
import { Suspense } from "react";
import Filters from "@/components/Filters";
import ListingCard from "@/components/ListingCard";
import TabbedLayout, { type Tab } from "@/components/TabbedLayout";
import GoogleMap from "@/components/GoogleMap";
import AboutSection from "@/components/AboutSection";
import ContactForm from "@/components/ContactForm";
import type { Listing } from "@/lib/types";

type HomeTabsProps = {
  filteredListings: Listing[];
  allListings?: Listing[];
};

export default function HomeTabs({ filteredListings, allListings }: HomeTabsProps) {
  const tabs: Tab[] = [
    {
      id: "overview",
      label: "Residential Listings",
      content: (
        <div className="space-y-6">
          <Suspense fallback={<div className="card p-4">Loading filters...</div>}>
            <Filters allListings={allListings || filteredListings} />
          </Suspense>
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
          <Suspense fallback={<div className="card p-4">Loading filters...</div>}>
            <Filters allListings={allListings || filteredListings} />
          </Suspense>
          <GoogleMap listings={filteredListings} height="600px" />
        </div>
      ),
    },
    {
      id: "apply",
      label: "Submit an Application",
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

