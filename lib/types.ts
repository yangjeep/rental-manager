export type Listing = {
  id: string;
  title: string;
  slug: string;
  price: number;
  city: string;
  bedrooms: number;
  status: "Available" | "Rented" | "Pending";
  imageUrl?: string;           // primary image (fallback)
  images?: string[];           // multi-image gallery
  description?: string;
  address?: string;

  // New fields
  parking?: string | boolean;  // e.g., "1 spot" or true/false
  pets?: "Allowed" | "Not Allowed" | "Conditional" | string;
  utilitiesIncluded?: string[]; // e.g., ["Water","Heat"]
};
