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
          {/* Combined Map and Listings Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Map Section - 70% on desktop */}
            <div className="w-full lg:w-[70%]">
              <GoogleMap listings={filteredListings} height="600px" />
            </div>
            {/* Listings Section - 30% on desktop */}
            <div className="w-full lg:w-[30%]">
              <div className="flex flex-col gap-6">
                {filteredListings.map((l: Listing) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
              {filteredListings.length === 0 && (
                <div className="opacity-70">No listings match your filters.</div>
              )}
            </div>
          </div>
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

