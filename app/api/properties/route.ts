import { NextResponse } from "next/server";
import { fetchListings } from "@/lib/fetchListings";

export async function GET() {
  try {
    const listings = await fetchListings();
    // Return titles and record IDs for the dropdown
    // Use D1 id field (already a string) as recordId
    const properties = listings.map((listing) => ({
      title: listing.title,
      recordId: listing.id,
    }));
    return NextResponse.json(properties);
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

