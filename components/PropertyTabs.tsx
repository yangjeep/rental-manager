"use client";
import { useState } from "react";
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
  const [activeTab, setActiveTab] = useState("overview");
  const gallery = listing.images && listing.images.length ? listing.images : [listing.imageUrl || "/placeholder1.jpg", "/placeholder2.jpg"];

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
          <button
            onClick={() => setActiveTab("apply")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Apply Now
          </button>
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
      id: "apply",
      label: "Submit an Application",
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

  return <TabbedLayout tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
}

function fmtPrice(n: number) {
  return `$${(n || 0).toLocaleString()}`;
}

