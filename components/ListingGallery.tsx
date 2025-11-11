"use client";
import { useState } from "react";

export default function ListingGallery({ images = [] as string[], alt = "" }) {
  // 如果没有图片，显示 placeholder
  const displayImages = images && images.length > 0 ? images : ["/placeholder.jpg"];

  const [idx, setIdx] = useState(0);

  return (
    <div className="space-y-3">
      <div className="relative">
        <img
          src={displayImages[idx]}
          alt={alt}
          className="w-full rounded-2xl border border-white/10 object-cover max-h-[520px]"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            if (displayImages[idx] !== "/placeholder.jpg") {
              (e.target as HTMLImageElement).src = "/placeholder.jpg";
            }
          }}
        />
        {displayImages.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 flex items-center">
              <button
                className="m-2 rounded-xl bg-black/40 px-3 py-2 text-sm"
                onClick={() => setIdx((idx - 1 + displayImages.length) % displayImages.length)}
                aria-label="Previous"
              >
                ‹
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                className="m-2 rounded-xl bg-black/40 px-3 py-2 text-sm"
                onClick={() => setIdx((idx + 1) % displayImages.length)}
                aria-label="Next"
              >
                ›
              </button>
            </div>
          </>
        )}
      </div>

      {displayImages.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {displayImages.map((src, i) => (
          <button
            key={i}
            className={`rounded-xl overflow-hidden border ${i===idx ? "border-white/80" : "border-white/10 opacity-70 hover:opacity-100"}`}
            onClick={() => setIdx(i)}
            aria-label={`image ${i+1}`}
          >
            <img src={src} alt={`${alt} ${i+1}`} className="h-16 w-full object-cover" />
          </button>
        ))}
        </div>
      )}
    </div>
  );
}
