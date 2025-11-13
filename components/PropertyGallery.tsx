'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Listing } from '@/lib/types';

interface PropertyGalleryProps {
  listing: Listing;
}

export function PropertyGallery({ listing }: PropertyGalleryProps) {
  const images = listing.images && listing.images.length > 0 
    ? listing.images 
    : [listing.imageUrl || "/placeholder.jpg"];
  
  const [selectedImage, setSelectedImage] = useState(images[0]);

  if (images.length === 1) {
    return (
      <div className="my-6">
        <Image
          src={images[0]}
          alt={`${listing.title} photo`}
          width={1200}
          height={800}
          className="w-full h-auto rounded-2xl object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 my-6">
      <div className="w-full rounded-2xl overflow-hidden bg-card/85 border border-white/8">
        <Image
          src={selectedImage}
          alt={`${listing.title} photo`}
          width={1200}
          height={800}
          className="w-full h-auto block object-cover"
          loading="lazy"
        />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedImage(img)}
            className={`bg-transparent border-2 rounded-xl p-0 cursor-pointer overflow-hidden transition-colors aspect-square ${
              selectedImage === img
                ? 'border-accent opacity-100'
                : 'border-transparent hover:border-white/30 hover:opacity-90'
            }`}
            aria-label={`View image ${idx + 1} of ${images.length}`}
          >
            <Image
              src={img}
              alt={`${listing.title} photo ${idx + 1}`}
              width={80}
              height={80}
              className="w-full h-full object-cover block"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

