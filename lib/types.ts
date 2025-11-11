export type Listing = {
  id: string;
  title: string;
  slug: string;
  price: number;                 // from "Monthly Rent"
  city: string;
  address?: string;
  status: "Available" | "Rented" | "Pending" | string;
  bedrooms: number;
  bathrooms?: number;
  parking?: string;              // e.g., "1 spot", "Available", "No"
  pets?: "Allowed" | "Not Allowed" | "Conditional" | string;
  description?: string;

  imageUrl?: string;             // cover fallback
  images?: string[];             // gallery (when DRIVE_LIST_ENDPOINT is set)
  imageFolderUrl?: string;       // raw folder link
};

