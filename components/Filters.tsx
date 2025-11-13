"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect, useMemo } from "react";
import type { Listing } from "@/lib/types";

type FiltersProps = {
  allListings?: Listing[];
};

export default function Filters({ allListings }: FiltersProps = {}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [city, setCity] = useState(sp.get("city") || "");
  const [bedrooms, setBedrooms] = useState(sp.get("bedrooms") || "");
  const [min, setMin] = useState(sp.get("min") || "");
  const [max, setMax] = useState(sp.get("max") || "");
  const [status, setStatus] = useState(sp.get("status") || "");
  const [pet, setPet] = useState(sp.get("pet") || "");

  // Get available cities from all listings
  const availableCities = useMemo(() => {
    if (!allListings) return [];
    const cities = new Set<string>();
    allListings.forEach(listing => {
      if (listing.city && listing.city.trim()) {
        cities.add(listing.city.trim());
      }
    });
    return Array.from(cities).sort();
  }, [allListings]);

  useEffect(() => {
    setCity(sp.get("city") || "");
    setBedrooms(sp.get("bedrooms") || "");
    setMin(sp.get("min") || "");
    setMax(sp.get("max") || "");
    setStatus(sp.get("status") || "");
    setPet(sp.get("pet") || "");
  }, [sp]);

  // Apply filters in real-time whenever they change
  useEffect(() => {
    const p = new URLSearchParams();
    if (city && city !== "All") p.set("city", city);
    if (bedrooms) p.set("bedrooms", bedrooms);
    if (min) p.set("min", min);
    if (max) p.set("max", max);
    if (status) p.set("status", status);
    if (pet) p.set("pet", pet);
    router.push(`/?${p.toString()}`);
  }, [city, bedrooms, min, max, status, pet, router]);

  const reset = useCallback(() => {
    setCity(""); setBedrooms(""); setMin(""); setMax(""); setStatus(""); setPet("");
    router.push(`/`);
  }, [router]);

  return (
    <section className="card p-4">
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <div>
          <div className="label mb-1">City</div>
          {availableCities.length > 0 ? (
            <select className="input w-full" value={city || "All"} onChange={e => setCity(e.target.value)}>
              <option value="All">All</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <input className="input w-full" value={city} onChange={e => setCity(e.target.value)} placeholder="Ottawa" />
          )}
        </div>
        <div>
          <div className="label mb-1">Bedrooms</div>
          <select className="input w-full" value={bedrooms} onChange={e => setBedrooms(e.target.value)}>
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>
        <div>
          <div className="label mb-1">Min $</div>
          <input className="input w-full" value={min} onChange={e => setMin(e.target.value)} inputMode="numeric" placeholder="1200" />
        </div>
        <div>
          <div className="label mb-1">Max $</div>
          <input className="input w-full" value={max} onChange={e => setMax(e.target.value)} inputMode="numeric" placeholder="3000" />
        </div>
        <div>
          <div className="label mb-1">Status</div>
          <select className="input w-full" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Available only</option>
            <option value="Available">Available</option>
            <option value="Pending">Pending</option>
            <option value="Rented">Rented</option>
          </select>
        </div>
        <div>
          <div className="label mb-1">Pet</div>
          <select className="input w-full" value={pet} onChange={e => setPet(e.target.value)}>
            <option value="">Any</option>
            <option value="Allowed">Allowed</option>
            <option value="Conditional">Conditional</option>
            <option value="Not Allowed">Not Allowed</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn w-full" onClick={reset}>Reset</button>
        </div>
      </div>
    </section>
  );
}
