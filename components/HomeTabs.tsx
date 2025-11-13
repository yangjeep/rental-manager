"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
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
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function HomeTabs({ filteredListings, allListings, searchParams }: HomeTabsProps) {
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  
  // Construct query string for property links
  const queryString = (() => {
    if (!searchParams || Object.keys(searchParams).length === 0) return "";
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, Array.isArray(value) ? value[0] : value);
      }
    });
    return params.toString();
  })();
  
  // Check if any filters are applied
  const hasFilters = searchParams && Object.keys(searchParams).length > 0;
  
  const tabs: Tab[] = [
    {
      id: "overview",
      label: "Residential Listings",
      content: (
        <div className="space-y-6">
          {hasFilters && (
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Go back to All Listings
            </Link>
          )}
          <Suspense fallback={<div className="card p-4">Loading filters...</div>}>
            <Filters allListings={allListings || filteredListings} />
          </Suspense>
          {/* Combined Map and Listings Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Map Section - 70% on desktop */}
            <div className="w-full lg:w-[70%]">
              <GoogleMap 
                listings={filteredListings} 
                height="600px" 
                selectedListingId={selectedListingId}
              />
            </div>
            {/* Listings Section - 30% on desktop */}
            <div className="w-full lg:w-[30%] lg:max-h-[600px] lg:overflow-y-auto lg:pr-2">
              <div className="flex flex-col gap-6">
                {filteredListings.map((l: Listing) => (
                  <ListingCard 
                    key={l.id} 
                    listing={l}
                    queryString={queryString}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedListingId(l.id);
                    }}
                    isSelected={selectedListingId === l.id}
                  />
                ))}
                {filteredListings.length === 0 && (
                  <div className="opacity-70">No listings match your filters.</div>
                )}
              </div>
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

